#!/usr/bin/env python3
"""
Streamlit UI for ETI RAG system.
Simple chat interface to query the HR manual.
"""

import streamlit as st
import requests
import os
from typing import Dict, List

API_BASE_URL = "http://127.0.0.1:8080"

def get_current_question():
    """Get the current question from any active input key"""
    for key in st.session_state:
        if key.startswith("question_input") and st.session_state[key]:
            return st.session_state[key]
    return ""

def on_input_change():
    """Callback for when user presses Enter in text input"""
    current_value = get_current_question()
    if current_value.strip() and not st.session_state.is_processing:
        st.session_state.enter_pressed = True
        st.session_state.is_processing = True

st.set_page_config(
    page_title="ETI HR Manual Chat",
    page_icon="📖",
    layout="wide",
    initial_sidebar_state="expanded",
    menu_items=None
)

st.markdown("""
<style>
/* Hide Streamlit branding and menu */
.stDeployButton {display:none;}
footer {visibility: hidden;}
#MainMenu {visibility: hidden;}
header[data-testid="stHeader"] {visibility: hidden;}

.main-header {
    text-align: center;
    padding: 1rem 0;
    border-bottom: 2px solid #e0e0e0;
    margin-bottom: 2rem;
}
.chat-message {
    padding: 1rem;
    border-radius: 0.5rem;
    margin: 1rem 0;
    border: 1px solid #e0e0e0;
}
.user-message {
    background-color: #f0f8ff;
    border-left: 4px solid #4CAF50;
}
.assistant-message {
    background-color: #f9f9f9;
    border-left: 4px solid #2196F3;
}
.citation {
    background-color: #fff3cd;
    color: #856404;
    padding: 0.5rem;
    border-radius: 0.25rem;
    margin: 0.5rem 0;
    font-size: 0.9em;
    border: 1px solid #ffeaa7;
}

/* Dark mode citation styling - keep yellow background, fix text color */
@media (prefers-color-scheme: dark) {
    .citation {
        color: #2d3748;
    }
}

/* Streamlit dark theme citation styling - keep yellow background, fix text color */
.stApp[data-theme="dark"] .citation {
    color: #2d3748 !important;
}
.metrics {
    display: flex;
    justify-content: space-around;
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 0.5rem;
    margin: 1rem 0;
}

/* Dark mode metrics styling */
@media (prefers-color-scheme: dark) {
    .metrics {
        background-color: #374151;
    }
}

.stApp[data-theme="dark"] .metrics {
    background-color: #374151 !important;
}
.error-message {
    background-color: #ffe6e6;
    color: #d32f2f;
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid #ffcdd2;
}
</style>
""", unsafe_allow_html=True)


def check_api_health() -> bool:
    try:
        response = requests.get(f"{API_BASE_URL}/healthz", timeout=5)
        return response.status_code == 200 and response.json().get("ok", False)
    except:
        return False


def validate_token(token: str) -> Dict:
    """Validate API token with backend."""
    try:
        response = requests.post(
            f"{API_BASE_URL}/validate-token",
            json={"token": token},
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"valid": False, "message": f"Server error: {response.status_code}"}
            
    except requests.exceptions.Timeout:
        return {"valid": False, "message": "Request timeout"}
    except requests.exceptions.ConnectionError:
        return {"valid": False, "message": "Connection error"}
    except Exception as e:
        return {"valid": False, "message": f"Error: {str(e)}"}


def query_api(question: str, max_tokens: int = 600) -> Dict:
    try:
        headers = {"Content-Type": "application/json"}
        
        # Add authorization header if token is available in session state
        if hasattr(st.session_state, 'api_token') and st.session_state.api_token:
            headers["Authorization"] = f"Bearer {st.session_state.api_token}"
        
        response = requests.post(
            f"{API_BASE_URL}/ask",
            json={"query": question, "max_tokens": max_tokens},
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"API error: {response.status_code} - {response.text}"}
            
    except requests.exceptions.Timeout:
        return {"error": "Request timeout - API took too long to respond"}
    except requests.exceptions.ConnectionError:
        return {"error": "Connection error - Could not connect to API"}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}


def display_response(response: Dict):
    if "error" in response:
        st.markdown(f'<div class="error-message">❌ {response["error"]}</div>', unsafe_allow_html=True)
        return
    
    st.markdown('<div class="assistant-message chat-message">', unsafe_allow_html=True)
    st.markdown("**🤖 Assistant:**")
    st.markdown(response.get("answer", "No answer provided"))
    st.markdown('</div>', unsafe_allow_html=True)
    
    # Only show citations if the answer is not "Not specified in the retrieved sections"
    answer = response.get("answer", "")
    citations = response.get("citations", [])
    
    if citations and "Not specified in the retrieved sections" not in answer:
        st.markdown("**📚 Citations:**")
        for citation in citations:
            st.markdown(f'<div class="citation">📄 {citation}</div>', unsafe_allow_html=True)
    
    latency = response.get("latency_ms", 0)
    retrieved_count = len(response.get("retrieved_ids", []))
    
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("⏱️ Response Time", f"{latency} ms")
    with col2:
        st.metric("📊 Chunks Retrieved", retrieved_count)
    with col3:
        st.metric("📑 Citations", len(citations))
    st.markdown('</div>', unsafe_allow_html=True)


def main():
    # Initialize session state variables first
    if "messages" not in st.session_state:
        st.session_state.messages = []
    
    if "auto_ask" not in st.session_state:
        st.session_state.auto_ask = False
    
    if "pending_question" not in st.session_state:
        st.session_state.pending_question = ""
    
    if "is_processing" not in st.session_state:
        st.session_state.is_processing = False
    
    if "clear_input" not in st.session_state:
        st.session_state.clear_input = False
    
    if "manual_ask" not in st.session_state:
        st.session_state.manual_ask = False
    
    if "enter_pressed" not in st.session_state:
        st.session_state.enter_pressed = False
    
    # Token-related session state
    if "api_token" not in st.session_state:
        st.session_state.api_token = ""
    
    if "token_valid" not in st.session_state:
        st.session_state.token_valid = False
    
    if "token_message" not in st.session_state:
        st.session_state.token_message = ""

    st.markdown('<div class="main-header">', unsafe_allow_html=True)
    st.title("📖 ETI HR Manual Chat")
    st.markdown("Ask questions about ETI HR policies and procedures")
    st.markdown('</div>', unsafe_allow_html=True)
    
    with st.sidebar:
        st.header("🔐 API Token")
        
        # Token input section
        token_input = st.text_input(
            "Enter your API token:",
            type="password",
            value=st.session_state.api_token,
            key="token_input",
            placeholder="Enter your API token here..."
        )
        
        # Validate token button
        if st.button("🔍 Validate Token", disabled=not token_input.strip()):
            if token_input.strip():
                with st.spinner("Validating token..."):
                    validation_result = validate_token(token_input.strip())
                    st.session_state.token_valid = validation_result.get("valid", False)
                    st.session_state.token_message = validation_result.get("message", "")
                    
                    if st.session_state.token_valid:
                        st.session_state.api_token = token_input.strip()
                    else:
                        st.session_state.api_token = ""
                st.rerun()
        
        # Show token status
        if st.session_state.token_valid:
            st.success("✅ Token is valid")
        elif st.session_state.token_message:
            st.error(f"❌ {st.session_state.token_message}")
        elif not st.session_state.api_token:
            st.warning("⚠️ Please enter and validate your API token to use the chat")
        
        st.header("⚙️ Settings")
        
        api_healthy = check_api_health()
        if api_healthy:
            st.success("✅ API is running")
        else:
            st.error("❌ API not available")
            st.markdown("Make sure the FastAPI service is running on localhost:8080")
        
        max_tokens = st.slider("Max tokens in response", 100, 1000, 600)
        
        st.header("📝 Example Questions")
        example_questions = [
            "What is the vacation policy?",
            "How do I request time off?",
            "What are the working hours?",
            "What is the dress code policy?",
            "How is performance evaluated?",
            "What are the benefits offered?",
            "What is the remote work policy?",
            "How do I report workplace issues?"
        ]
        
        for question_text in example_questions:
            if st.button(
                question_text, 
                key=f"example_{question_text}", 
                disabled=st.session_state.is_processing or not st.session_state.token_valid
            ):
                st.session_state.pending_question = question_text
                st.session_state.auto_ask = True
                st.session_state.is_processing = True
                st.rerun()
        
        st.header("ℹ️ About")
        st.markdown("""
        This chat interface allows you to ask questions about ETI HR policies and procedures.
        
        **Features:**
        - Hybrid search (BM25 + FAISS)
        - Accurate citations
        - Real-time responses
        
        **Note:** Answers are based strictly on the HR manual content.
        """)
    
    st.header("💬 Chat")
    
    for message in st.session_state.messages:
        if message["role"] == "user":
            st.markdown('<div class="user-message chat-message">', unsafe_allow_html=True)
            st.markdown(f"**👤 You:** {message['content']}")
            st.markdown('</div>', unsafe_allow_html=True)
        else:
            display_response(message["response"])
    
    if st.session_state.clear_input:
        if "input_key_counter" not in st.session_state:
            st.session_state.input_key_counter = 0
        st.session_state.input_key_counter += 1
        st.session_state.clear_input = False
        default_value = ""
        input_key = f"question_input_{st.session_state.input_key_counter}"
    elif st.session_state.pending_question:
        default_value = st.session_state.pending_question
        input_key = "question_input"
    else:
        default_value = ""
        input_key = "question_input"
    
    question = st.text_input(
        "Ask a question about ETI HR policies:",
        value=default_value,
        key=input_key,
        placeholder="e.g., What is the vacation policy?" if st.session_state.token_valid else "Please validate your API token first",
        disabled=st.session_state.is_processing or not st.session_state.token_valid,
        on_change=on_input_change
    )
    
    if st.session_state.pending_question:
        st.session_state.pending_question = ""
    
    col1, col2 = st.columns([1, 4])
    
    with col1:
        ask_button = st.button(
            "🚀 Ask", 
            type="primary", 
            disabled=not api_healthy or st.session_state.is_processing or not st.session_state.token_valid
        )
        
        current_question = get_current_question()
        if ask_button and current_question.strip() and api_healthy and st.session_state.token_valid and not st.session_state.is_processing:
            st.session_state.is_processing = True
            st.session_state.manual_ask = True
            st.rerun()
    
    with col2:
        if st.button("🗑️ Clear Chat", disabled=st.session_state.is_processing):
            st.session_state.messages = []
            st.rerun()
    
    current_question = get_current_question()
    should_ask = (
        (ask_button and current_question.strip()) or 
        (st.session_state.auto_ask and current_question.strip()) or 
        (st.session_state.manual_ask and current_question.strip()) or
        (st.session_state.enter_pressed and current_question.strip())
    )
    
    if should_ask:
        if not api_healthy:
            st.error("API is not available. Please check the service.")
            return
        
        if not st.session_state.token_valid:
            st.error("Please enter and validate your API token first.")
            return
        
        if not st.session_state.is_processing:
            st.session_state.is_processing = True
        
        st.session_state.auto_ask = False
        st.session_state.manual_ask = False
        st.session_state.enter_pressed = False
        
        st.session_state.messages.append({
            "role": "user",
            "content": current_question
        })
        
        with st.spinner("🔍 Searching the HR manual..."):
            response = query_api(current_question, max_tokens)
        
        st.session_state.messages.append({
            "role": "assistant",
            "response": response
        })
        
        st.session_state.clear_input = True
        st.session_state.is_processing = False
        
        st.rerun()
    
    elif ask_button and not question.strip():
        st.warning("Please enter a question.")
    elif ask_button and not st.session_state.token_valid:
        st.warning("Please validate your API token first.")
    
    st.markdown("---")
    st.markdown(
        "Built with ❤️ using Streamlit, FastAPI, and OpenAI | "
        "ETI HR Manual RAG System v1.0"
    )


if __name__ == "__main__":
    main()