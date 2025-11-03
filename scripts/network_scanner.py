#!/usr/bin/env python3
import subprocess
import socket
import json

def get_local_ip():
    """Get the local IP address of the machine"""
    try:
        # This gets the local IP address that connects to the internet
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception as e:
        print(f"Error getting local IP: {e}")
        return None

def run_nmap_scan(ip_range):
    """Run Nmap scan on the specified IP range"""
    try:
        print(f"Starting Nmap scan on {ip_range}...")
        # Basic Nmap scan - adjust the options as needed
        command = ["nmap", "-sn", ip_range]
        result = subprocess.run(command, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("\nNmap scan results:")
            print("-" * 50)
            print(result.stdout)
            print("-" * 50)
            return result.stdout
        else:
            print(f"Nmap scan failed: {result.stderr}")
            return None
    except Exception as e:
        print(f"Error running Nmap: {e}")
        return None

def main():
    print("Network Scanner")
    print("=" * 50)
    
    # Get local IP and determine network range
    local_ip = get_local_ip()
    if not local_ip:
        print("Could not determine local IP address.")
        return
        
    print(f"Your local IP address is: {local_ip}")
    
    # Create a /24 network range from the local IP
    network_range = ".".join(local_ip.split(".")[:3]) + ".0/24"
    print(f"Scanning network range: {network_range}")
    
    # Run Nmap scan
    run_nmap_scan(network_range)

if __name__ == "__main__":
    main()
