from flask import Flask, render_template, jsonify
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)

# List of URLs to scrape
urls = [
    "https://www.terra-balance.com/home",
    "https://www.terra-balance.com/our-services",
    "https://www.terra-balance.com/stories-projects",
    "https://www.terra-balance.com/about",
    "https://www.terra-balance.com/contact-us"
]

# Function to scrape the page
def scrape_page(url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        # Extract title and body content
        title = soup.title.text.strip() if soup.title else 'No Title Found'
        body = soup.find('body').get_text(strip=True)[:500] if soup.find('body') else 'No Body Content Found'
        return {
            'title': title,
            'body': body
        }
    except requests.exceptions.RequestException as e:
        return {
            'title': 'Failed to retrieve data',
            'body': str(e)
        }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/scrape_data')
def scrape_data():
    all_data = [scrape_page(url) for url in urls]
    return jsonify(all_data)

if __name__ == '__main__':
    app.run(debug=True)
