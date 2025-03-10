from flask import Flask, request, jsonify, render_template
import google.generativeai as genai
import os
import requests
import json
from dotenv import load_dotenv
from flask_cors import CORS
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Configure the Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("No GEMINI_API_KEY found in environment variables")

logger.info(f"API Key loaded: {GEMINI_API_KEY[:5]}...")

# List of models to try in order of preference
MODEL_NAMES = [
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-pro',
    'gemini-pro-vision'
]

# Configure Gemini with additional settings for better responses
generation_config = {
    "temperature": 0.9,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 1024,
}

safety_settings = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
]

# Function to perform a web search for up-to-date information
def web_search(query, num_results=3):
    try:
        # Get the SerpAPI key from environment variables
        serpapi_key = os.getenv("SERPAPI_KEY")
        
        if not serpapi_key:
            logger.warning("No SERPAPI_KEY found. Web search functionality is limited.")
            return "I don't have real-time web search capability at the moment. My knowledge has a cutoff date, so some information might be outdated."
        
        # Log the search query and key (partially masked)
        logger.info(f"Searching for: {query} with SerpAPI key: {serpapi_key[:5]}...")
        
        # Construct the SerpAPI URL with parameters
        params = {
            "q": query,
            "api_key": serpapi_key,
            "engine": "google",
            "google_domain": "google.com",
            "gl": "us",
            "hl": "en",
            "num": num_results
        }
        
        # Convert params to URL query string
        query_string = "&".join([f"{k}={requests.utils.quote(str(v))}" for k, v in params.items()])
        search_url = f"https://serpapi.com/search?{query_string}"
        
        # Make the request to SerpAPI
        logger.info(f"Making request to SerpAPI: {search_url[:100]}...")
        response = requests.get(search_url)
        
        # Log the response status
        logger.info(f"SerpAPI response status: {response.status_code}")
        
        if response.status_code == 200:
            # Parse the JSON response
            try:
                data = response.json()
                logger.info(f"SerpAPI response keys: {list(data.keys())}")
                
                # Get current time
                current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                result = f"Current date and time: {current_time}\n\n"
                
                # Extract search information
                search_info = []
                
                # Extract knowledge graph if available
                if 'knowledge_graph' in data:
                    kg = data['knowledge_graph']
                    search_info.append("Knowledge Graph Information:")
                    if 'title' in kg:
                        search_info.append(f"Title: {kg['title']}")
                    if 'description' in kg:
                        search_info.append(f"Description: {kg['description']}")
                    if 'source' in kg:
                        search_info.append(f"Source: {kg['source']}")
                    search_info.append("")
                
                # Extract organic results
                if 'organic_results' in data:
                    organic = data['organic_results'][:num_results]
                    search_info.append("Latest Search Results:")
                    for item in organic:
                        title = item.get('title', 'No title')
                        snippet = item.get('snippet', 'No description')
                        search_info.append(f"- {title}: {snippet}")
                    search_info.append("")
                
                # Extract news results if available
                if 'news_results' in data:
                    news = data['news_results'][:num_results]
                    search_info.append("Latest News:")
                    for item in news:
                        title = item.get('title', 'No title')
                        date = item.get('date', '')
                        source = item.get('source', '')
                        info = f"- {title}"
                        if source:
                            info += f" ({source})"
                        if date:
                            info += f" - {date}"
                        search_info.append(info)
                    search_info.append("")
                
                # If no results found, try Wikipedia
                if not search_info:
                    wiki_info = get_wikipedia_info(query)
                    if wiki_info:
                        search_info.append("Information from Wikipedia:")
                        search_info.append(wiki_info)
                        search_info.append("")
                
                # If still no results, provide a message
                if not search_info:
                    search_info.append("I couldn't find specific information about your query.")
                    search_info.append("")
                
                # Add search links
                search_info.append("For the most up-to-date information, you can check these sources:")
                search_info.append(f"- Google Search: https://www.google.com/search?q={query.replace(' ', '+')}")
                search_info.append(f"- News Search: https://news.google.com/search?q={query.replace(' ', '+')}")
                search_info.append(f"- Twitter Search: https://twitter.com/search?q={query.replace(' ', '+')}")
                
                # Combine all information
                result += "\n".join(search_info)
                
                return result
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing JSON response: {str(e)}")
                logger.error(f"Response content: {response.text[:500]}")
                return f"Current date and time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\nI encountered an error processing search results. Please try again with a different query."
        else:
            logger.error(f"SerpAPI request failed with status code: {response.status_code}")
            logger.error(f"Response content: {response.text[:500]}")
            return f"Current date and time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\nI encountered an error while searching for information. Please try again later."
    except Exception as e:
        logger.error(f"Error in web search: {str(e)}")
        return f"Current date and time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\nI encountered an error while searching for information: {str(e)}"

# Helper function to get information from Wikipedia
def get_wikipedia_info(query, sentences=3):
    try:
        # Wikipedia API endpoint
        url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{query.replace(' ', '_')}"
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            # Extract the summary
            if 'extract' in data:
                return data['extract']
        
        # Try a search if direct lookup fails
        search_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={query}&format=json"
        search_response = requests.get(search_url)
        
        if search_response.status_code == 200:
            search_data = search_response.json()
            search_results = search_data.get('query', {}).get('search', [])
            
            if search_results:
                # Get the first result title
                first_result = search_results[0]
                title = first_result.get('title', '')
                
                # Get the summary for this title
                if title:
                    title_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{title.replace(' ', '_')}"
                    title_response = requests.get(title_url)
                    
                    if title_response.status_code == 200:
                        title_data = title_response.json()
                        if 'extract' in title_data:
                            return title_data['extract']
        
        return ""
    except Exception as e:
        logger.error(f"Error getting Wikipedia info: {str(e)}")
        return ""

try:
    # Configure the Gemini API with the API key
    genai.configure(api_key=GEMINI_API_KEY)
    
    # List available models to check which ones are accessible
    logger.info("Listing available models...")
    available_models = []
    for model_info in genai.list_models():
        model_name = model_info.name.split('/')[-1]
        available_models.append(model_name)
        logger.info(f"Available model: {model_name}")
    
    # Find the first available model from our preference list
    model_name = None
    for name in MODEL_NAMES:
        if name in available_models or any(name in m for m in available_models):
            model_name = name
            logger.info(f"Selected model: {model_name}")
            break
    
    if not model_name:
        # If none of our preferred models are available, use the first available model
        if available_models:
            model_name = available_models[0]
            logger.info(f"Using first available model: {model_name}")
        else:
            raise ValueError("No Gemini models available")
    
    # Initialize the model with improved configuration
    model = genai.GenerativeModel(
        model_name,
        generation_config=generation_config,
        safety_settings=safety_settings
    )
    logger.info(f"Gemini API configured successfully with model: {model_name}")
except Exception as e:
    logger.error(f"Error configuring Gemini API: {str(e)}")
    raise

app = Flask(__name__, static_folder='static', template_folder='templates')
# Enable CORS for all routes
CORS(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message', '')
    
    logger.info(f"Received message: {user_message}")
    
    if not user_message:
        return jsonify({'error': 'No message provided'}), 400
    
    try:
        # Always perform web search for all queries to get the most up-to-date information
        logger.info("Performing web search for up-to-date information")
        web_info = web_search(user_message)
        
        # Construct a prompt that includes web search results
        prompt = f"""
User Query: {user_message}

CURRENT INFORMATION:
{web_info}

Instructions:
1. You are a helpful assistant providing accurate and up-to-date information.
2. Use ONLY the CURRENT INFORMATION above to answer the user's query.
3. The current date and time information is accurate - use it to frame your response.
4. Format your response in a clear, conversational manner.
5. If the CURRENT INFORMATION contains search results or news, summarize the most relevant points.
6. Do not mention that you're using search results or external information - just provide the answer directly.
7. Do not apologize for limitations or mention your knowledge cutoff date.
8. If the information provided doesn't fully answer the query, acknowledge this and suggest the user check the provided links.
"""
        
        # Generate response from Gemini
        logger.info("Sending request to Gemini API")
        response = model.generate_content(prompt)
        logger.info("Received response from Gemini API")
        
        # Clean up the response if needed
        response_text = response.text
        
        return jsonify({'response': response_text})
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001) 