import asyncio
import aiohttp
import random
import time
import logging
import json
from bs4 import BeautifulSoup
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_socketio import SocketIO
import pandas as pd
import datetime
import os


# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')


# Global variable for the scraping data
all_data = []


# User-agent list for rotation
user_agents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:52.0) Gecko/20100101 Firefox/52.0"
]


# Flask app and SocketIO setup
app = Flask(__name__)
socketio = SocketIO(app, async_mode='eventlet', cors_allowed_origins="*")


# Function to get random headers
def get_random_headers():
    headers = {
        'User-Agent': random.choice(user_agents),
    }
    return headers


# Async function to scrape metadata for a single ID
async def scrape_metadata_for_id(session, id):
    formatted_id = f"{str(id).zfill(8)}"
    url = f'https://www.digitale-sammlungen.de/en/details/bsb{formatted_id}'
    error_message = 'No error'


    try:
        logging.info(f"Processing ID: {formatted_id}")
        socketio.emit('log_message', f"Processing ID: {formatted_id}")  # Emit log to frontend


        async with session.get(url, headers=get_random_headers(), ssl=False) as response:
            if response.status == 404:
                error_message = f"404 Error: {formatted_id}"
                logging.warning(f"Error 404: {formatted_id} not found.")
                socketio.emit('log_message', f"Error 404: {formatted_id} not found.")  # Emit log to frontend
                return {
                    'Title': 'N/A',
                    'Authors': 'N/A',
                    'Publisher': 'N/A',
                    'Date': 'N/A',
                    'Extent (Number of Pages)': 'N/A',
                    'BSB ID': formatted_id,
                    'Language': 'N/A',
                    'Error': error_message
                }


            page_content = await response.text()
            soup = BeautifulSoup(page_content, 'html.parser')
            script_tag = soup.find('script', string=lambda t: t and 'var metadata' in t)


            if script_tag:
                json_data = script_tag.string.split('var metadata = ')[1].strip().rstrip(';')
                json_data = json_data.split('};')[0] + '}'
                metadata = json.loads(json_data)


                title = metadata.get('title', 'N/A')
                byline = metadata.get('byline', 'N/A')
                creators = metadata.get('creators', [])
                contributors = metadata.get('contributors', [])
                authors = byline.strip() if byline != 'N/A' else 'N/A'
                if authors == 'N/A':
                    if creators:
                        authors = ', '.join([creator['name'] for creator in creators])
                    elif contributors:
                        authors = ', '.join([contributor['name'] for contributor in contributors])
                    else:
                        authors = 'N/A'
                publisher = metadata.get('publishedBy', ['N/A'])[0]
                published_date = metadata.get('publishedDate', 'N/A')
                num_scans = metadata.get('numScans', 'N/A')
                bsb_id = metadata.get('id', 'N/A')
                languages = metadata.get('languages', [])
                language = next((lang['en'] for lang in languages if 'en' in lang), 'N/A')
            else:
                error_message = f"Metadata not found for ID: {formatted_id}"
                title, authors, publisher, published_date, num_scans, bsb_id, language = ('N/A',) * 7


            return {
                'Title': title,
                'Authors': authors,
                'Publisher': publisher,
                'Date': published_date,
                'Extent (Number of Pages)': num_scans,
                'BSB ID': bsb_id,
                'Language': language,
                'Error': error_message
            }


    except Exception as e:
        logging.error(f"Error processing ID {formatted_id}: {str(e)}")
        socketio.emit('log_message', f"Error processing ID {formatted_id}: {str(e)}")  # Emit log to frontend
        return {
            'Title': 'N/A',
            'Authors': 'N/A',
            'Publisher': 'N/A',
            'Date': 'N/A',
            'Extent (Number of Pages)': 'N/A',
            'BSB ID': formatted_id,
            'Language': 'N/A',
            'Error': str(e)
        }


# Function to save data to an Excel file asynchronously
async def save_to_excel(data):
    try:
        df = pd.DataFrame(data)
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        output_dir = 'scraped_files'
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)


        output_file = os.path.join(output_dir, f'scraped_data_{timestamp}.xlsx')
        df.to_excel(output_file, index=False, engine='openpyxl')
        logging.info(f"Data saved to {output_file}.")
        socketio.emit('log_message', f"Data saved to {output_file}.")  # Emit log to frontend
    
        # Now that the file is saved, make it available for download
        return output_file
    except Exception as e:
        logging.error(f"Error saving data: {str(e)}")
        socketio.emit('log_message', f"Error saving data: {str(e)}")  # Emit log to frontend


# Function to process IDs asynchronously
async def process_ids(ids):
    async with aiohttp.ClientSession() as session:
        tasks = []
        for id in ids:
            tasks.append(scrape_metadata_for_id(session, id))


        # Wait for all tasks to finish
        results = await asyncio.gather(*tasks)


        # Store results
        all_data.extend(results)


        # Save to Excel after all data is gathered
        output_file = await save_to_excel(all_data)

        # Emit the download URL to the frontend
        socketio.emit('download_ready', {
            
    'message': 'Scraping completed successfully!',
    'file_url': f'/download/{os.path.basename(output_file)}',
    're_enable_button': True
})
        
logging.info("Emitted scraping completion event to frontend.")
socketio.emit('log_message', "Scraping completed successfully! File ready for download.")

# Route to upload file and start scraping
@app.route('/upload_file', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400


    try:
        # Clear the previous state (last processed ID)
        global last_processed_id
        last_processed_id = None  # Reset the last processed ID
        write_last_processed_id(None)  # Delete the last processed ID in the file


        # Read file content (assuming it's a text file with one ID per line)
        file_content = file.read().decode('utf-8').strip()
        ids = file_content.splitlines()
        print(f"Received {len(ids)} IDs from the file.")  # Debug: log number of IDs


        # Get batch size and pause time from the frontend
        batch_size = int(request.form['batch_size'])  # Get batch size from frontend
        pause_time = int(request.form['pause_time'])  # Get pause time from frontend


        global all_data
        all_data = []  # Reset all_data before starting new scraping


        # Emit a message to notify frontend that scraping is starting
        socketio.emit('log_message', f"Scraping started with {len(ids)} IDs, batch size: {batch_size}, pause time: {pause_time} minutes.")


        # Start the batch processing in a separate greenlet to avoid blocking the main thread
        socketio.start_background_task(process_batches, ids, batch_size, pause_time)


        return jsonify(message="Scraping started!")


    except Exception as e:
        return jsonify({'error': str(e)}), 400


# Route to render the index page
@app.route('/')
def index():
    return render_template('index.html')


# Route to serve the file
@app.route('/download/<filename>')
def download_file(filename):
    return send_from_directory('scraped_files', filename)


# Function to process the batches with pauses between them
def process_batches(ids, batch_size, pause_time):
    last_processed_id = read_last_processed_id() or 0
    start_index = ids.index(str(last_processed_id)) if last_processed_id else 0
   
    for i in range(start_index, len(ids), batch_size):  # Process user-defined batch size
        batch = ids[i:i + batch_size]


        # Start the scraping task for the current batch
        asyncio.run(process_ids(batch))


        # Wait for the batch to finish
        write_last_processed_id(batch[-1])  # Save the last processed ID


        # Emit log message for batch completion
        socketio.emit('log_message', f"Batch completed. Waiting for {pause_time} minutes before next batch.")


        # Sleep for the user-defined pause time before the next batch
        time.sleep(pause_time * 60)  # Pause time in seconds

# Helper function to store the last processed ID in a file (or database)
def write_last_processed_id(id):
    with open('last_processed_id.txt', 'w') as f:
        f.write(str(id) if id is not None else '')  # Overwrite and clear file

# Helper function to read the last processed ID from a file (or database)
def read_last_processed_id():
    if os.path.exists('last_processed_id.txt'):
        with open('last_processed_id.txt', 'r') as f:
            return f.read().strip()
    return None

if __name__ == '__main__':
    socketio.run(app, host='127.0.0.1', port=5001, debug=True, allow_unsafe_werkzeug=True)
