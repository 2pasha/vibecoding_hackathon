#!/usr/bin/env python3
"""
Simple test script for the ETI RAG system.
Tests the ingestion and API functionality.
"""

import os
import sys
import time
import requests
import subprocess
from pathlib import Path

# Configuration
API_BASE_URL = "http://localhost:8080"
HR_MANUAL_PATH = "data/ETI_HR_Manual.pdf"
TEST_QUERIES = [
    "What is the vacation policy?",
    "How do I request time off?",
    "What are the working hours?",
    "What benefits are offered?",
]


def check_requirements():
    """Check if all requirements are met."""
    print("🔍 Checking requirements...")
    
    # Check OpenAI API key
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ OPENAI_API_KEY environment variable not set")
        return False
    
    # Check if HR manual exists
    if not Path(HR_MANUAL_PATH).exists():
        print(f"❌ HR manual not found at: {HR_MANUAL_PATH}")
        return False
    
    print("✅ Requirements check passed")
    return True


def test_ingestion():
    """Test the data ingestion process."""
    print("\n📚 Testing data ingestion...")
    
    try:
        result = subprocess.run([
            sys.executable, "scripts/ingest.py",
            "--pdf", HR_MANUAL_PATH,
            "--output-dir", "data/index"
        ], capture_output=True, text=True, check=True)
        
        print("✅ Ingestion completed successfully")
        print(f"Output: {result.stdout.split('Ingestion completed')[0]}...")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Ingestion failed: {e.stderr}")
        return False


def wait_for_api(timeout=30):
    """Wait for API to be ready."""
    print(f"\n⏳ Waiting for API to be ready (timeout: {timeout}s)...")
    
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            response = requests.get(f"{API_BASE_URL}/healthz", timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get("ok", False):
                    print("✅ API is ready and indexes are loaded")
                    return True
                else:
                    print("⏳ API running but indexes not loaded yet...")
            else:
                print(f"⏳ API returned status: {response.status_code}")
        except requests.exceptions.RequestException:
            print("⏳ API not ready yet...")
        
        time.sleep(2)
    
    print("❌ API not ready within timeout")
    return False


def test_queries():
    """Test the API with sample queries."""
    print("\n💬 Testing queries...")
    
    for i, query in enumerate(TEST_QUERIES, 1):
        print(f"\n🔍 Query {i}: {query}")
        
        try:
            response = requests.post(
                f"{API_BASE_URL}/ask",
                json={"query": query, "max_tokens": 600},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Response received ({data.get('latency_ms', 0)}ms)")
                print(f"📊 Retrieved {len(data.get('retrieved_ids', []))} chunks")
                print(f"📚 {len(data.get('citations', []))} citations")
                
                # Show first part of answer
                answer = data.get('answer', '')
                if answer:
                    preview = answer[:100] + "..." if len(answer) > 100 else answer
                    print(f"💡 Answer: {preview}")
                
            else:
                print(f"❌ Query failed: {response.status_code} - {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Query failed: {e}")


def test_full_system():
    """Run complete system test."""
    print("🚀 ETI RAG System Test")
    print("=" * 50)
    
    # Check requirements
    if not check_requirements():
        return False
    
    # Test ingestion
    if not test_ingestion():
        return False
    
    # Check if we need to start API manually
    if not wait_for_api(timeout=5):
        print("\n⚠️  API not running. Please start it manually:")
        print("   python -m uvicorn app.main:app --host 0.0.0.0 --port 8080")
        print("\nThen run this script again to test queries.")
        return False
    
    # Test queries
    test_queries()
    
    print("\n🎉 System test completed!")
    return True


def main():
    """Main test function."""
    if len(sys.argv) > 1:
        if sys.argv[1] == "--ingest-only":
            if check_requirements():
                return test_ingestion()
        elif sys.argv[1] == "--queries-only":
            if wait_for_api():
                test_queries()
                return True
    
    return test_full_system()


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
