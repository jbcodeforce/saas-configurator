#!/usr/bin/env python3
"""
Demo script for the SaaS Configurator full-stack application.
This script demonstrates the complete functionality of both backend and frontend.
"""

import subprocess
import time
import sys
import webbrowser
from pathlib import Path


def print_banner():
    """Print a welcome banner."""
    print("🚀" * 50)
    print("🚀  SaaS Configurator - Full Stack Demo  🚀")
    print("🚀" * 50)
    print()
    print("This demo will:")
    print("✅ Start the FastAPI backend server")
    print("✅ Start the React frontend server")
    print("✅ Open your browser to the application")
    print("✅ Show you the complete full-stack experience")
    print()


def check_dependencies():
    """Check if all dependencies are installed."""
    print("🔍 Checking dependencies...")
    
    # Check if uv is available
    try:
        subprocess.run(["uv", "--version"], capture_output=True, check=True)
        print("✅ uv package manager found")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ uv not found. Please install uv first:")
        print("   curl -LsSf https://astral.sh/uv/install.sh | sh")
        return False
    
    # Check if npm is available
    try:
        subprocess.run(["npm", "--version"], capture_output=True, check=True)
        print("✅ npm found")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ npm not found. Please install Node.js first:")
        print("   https://nodejs.org/")
        return False
    
    # Check if frontend folder exists
    frontend_path = Path("front-end")
    if not frontend_path.exists():
        print("❌ Frontend folder not found")
        return False
    else:
        print("✅ Frontend folder found")
    
    return True


def install_dependencies():
    """Install dependencies for both backend and frontend."""
    print("\n📦 Installing dependencies...")
    
    # Install backend dependencies
    print("Installing Python dependencies...")
    result = subprocess.run(["uv", "sync", "--dev"], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"❌ Failed to install Python dependencies: {result.stderr}")
        return False
    print("✅ Python dependencies installed")
    
    # Install frontend dependencies
    print("Installing Node.js dependencies...")
    result = subprocess.run(
        ["npm", "install"], 
        cwd="front-end", 
        capture_output=True, 
        text=True
    )
    if result.returncode != 0:
        print(f"❌ Failed to install Node.js dependencies: {result.stderr}")
        return False
    print("✅ Node.js dependencies installed")
    
    return True


def start_backend():
    """Start the FastAPI backend server."""
    print("\n🖥️  Starting FastAPI backend server...")
    
    # Start the backend server
    backend_process = subprocess.Popen(
        ["uv", "run", "python", "run.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    # Wait a moment for the server to start
    time.sleep(3)
    
    # Check if the server is running
    if backend_process.poll() is None:
        print("✅ FastAPI backend started successfully on http://localhost:8000")
        return backend_process
    else:
        stdout, stderr = backend_process.communicate()
        print(f"❌ Failed to start backend: {stderr}")
        return None


def start_frontend():
    """Start the React frontend server."""
    print("\n⚛️  Starting React frontend server...")
    
    # Start the frontend server
    frontend_process = subprocess.Popen(
        ["npm", "start"],
        cwd="front-end",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    # Wait for the frontend to start
    print("⏳ Waiting for React server to start...")
    time.sleep(10)
    
    # Check if the server is running
    if frontend_process.poll() is None:
        print("✅ React frontend started successfully on http://localhost:3000")
        return frontend_process
    else:
        stdout, stderr = frontend_process.communicate()
        print(f"❌ Failed to start frontend: {stderr}")
        return None


def open_browser():
    """Open the browser to the application."""
    print("\n🌐 Opening browser...")
    try:
        webbrowser.open("http://localhost:3000")
        print("✅ Browser opened to http://localhost:3000")
    except Exception as e:
        print(f"⚠️  Could not open browser automatically: {e}")
        print("Please manually open http://localhost:3000 in your browser")


def show_instructions():
    """Show usage instructions."""
    print("\n" + "="*60)
    print("🎉 SaaS Configurator is now running!")
    print("="*60)
    print()
    print("📋 What you can do:")
    print("  • View the React frontend at: http://localhost:3000")
    print("  • View the API documentation at: http://localhost:8000/docs")
    print("  • Create new cluster configurations")
    print("  • Edit existing configurations")
    print("  • Filter and search configurations")
    print("  • View detailed configuration information")
    print()
    print("🎯 Try these features:")
    print("  1. Click 'New Configuration' to create a cluster config")
    print("  2. Add some JSON configuration data like:")
    print('     {"nodes": 3, "cpu": "4 cores", "memory": "16GB"}')
    print("  3. Add tags like: production, kubernetes, critical")
    print("  4. Save and see it appear in the dashboard")
    print("  5. Click on configurations to view details")
    print("  6. Use filters to find specific configurations")
    print()
    print("🛑 To stop the servers:")
    print("   Press Ctrl+C in this terminal")
    print()


def cleanup(backend_process, frontend_process):
    """Clean up processes."""
    print("\n🧹 Shutting down servers...")
    
    if backend_process and backend_process.poll() is None:
        backend_process.terminate()
        backend_process.wait()
        print("✅ FastAPI backend stopped")
    
    if frontend_process and frontend_process.poll() is None:
        frontend_process.terminate()
        frontend_process.wait()
        print("✅ React frontend stopped")
    
    print("👋 Thanks for trying SaaS Configurator!")


def main():
    """Main demo function."""
    print_banner()
    
    if not check_dependencies():
        sys.exit(1)
    
    if not install_dependencies():
        sys.exit(1)
    
    backend_process = start_backend()
    if not backend_process:
        sys.exit(1)
    
    frontend_process = start_frontend()
    if not frontend_process:
        backend_process.terminate()
        sys.exit(1)
    
    open_browser()
    show_instructions()
    
    try:
        # Keep the script running
        while True:
            time.sleep(1)
            # Check if processes are still running
            if backend_process.poll() is not None:
                print("❌ Backend process died unexpectedly")
                break
            if frontend_process.poll() is not None:
                print("❌ Frontend process died unexpectedly")
                break
    
    except KeyboardInterrupt:
        print("\n⏹️  Received shutdown signal...")
    
    finally:
        cleanup(backend_process, frontend_process)


if __name__ == "__main__":
    main()
