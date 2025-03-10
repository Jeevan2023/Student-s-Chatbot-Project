# Gemini Chatbot

A simple chatbot application that uses Google's Gemini API. The application has an HTML/CSS/JavaScript frontend and a Python Flask backend.

## Prerequisites

- Python 3.7 or higher
- A Gemini API key (get one from [Google AI Studio](https://makersuite.google.com/app/apikey))

## Setup

1. Clone this repository or download the files.

2. Install the required Python packages:
   ```
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the project root directory with your Gemini API key:
   ```
   GEMINI_API_KEY=AIzaSyBd3AK41gOhj2vBQJoOZXpNAR-Nt0Rxgt4
   ```
   You can copy the `.env.example` file and rename it to `.env`, then replace the placeholder with your actual API key.

## Running the Application

1. Start the Flask server:
   ```
   python app.py
   ```

2. Open your web browser and navigate to:
   ```
   http://127.0.0.1:5001
   ```

3. Start chatting with the Gemini-powered chatbot!

## Features

- Clean, responsive UI with a pink theme
- Real-time chat with Gemini AI
- Web search capability for up-to-date information
- Typing indicators for a better user experience
- Formatted display of search results

## Getting Up-to-date Information

This chatbot has been enhanced to provide more current information by:

1. Using web search capabilities when queries seem to need recent information
2. Automatically detecting queries about current events, recent updates, or time-sensitive information
3. Displaying search results in a formatted way to distinguish between model knowledge and web search results

To enable web search functionality:
1. Sign up for a free API key at [SerpAPI](https://serpapi.com/)
2. Add your key to the `.env` file: `SERPAPI_KEY=your_key_here`

Without a SerpAPI key, the chatbot will still work but won't be able to provide real-time information.

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Python, Flask
- **AI**: Google Gemini API

## License

This project is open source and available under the MIT License.

## Troubleshooting

- If you encounter CORS issues, make sure you're running both the frontend and backend on the same domain.
- If the API calls fail, check that your Gemini API key is correctly set in the `.env` file.
- Make sure you have the required Python packages installed. 