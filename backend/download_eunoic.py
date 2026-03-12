import requests
import zipfile
import io
import os
import shutil

url = "https://github.com/Snepard/Eunoic/archive/refs/heads/main.zip"
print(f"Downloading {url}...")

# Clean up previous attempts
if os.path.exists("Eunoic.zip"):
    os.remove("Eunoic.zip")
if os.path.exists("Eunoic"):
    shutil.rmtree("Eunoic")

try:
    r = requests.get(url)
    if r.status_code == 200:
        print("Download success. extracting...")
        z = zipfile.ZipFile(io.BytesIO(r.content))
        z.extractall(".")
        print("Done.")
        # Rename Eunoic-main to Eunoic
        if os.path.exists("Eunoic-main"):
             if os.path.exists("Eunoic"):
                 shutil.rmtree("Eunoic")
             os.rename("Eunoic-main", "Eunoic")
        print("Renamed to Eunoic")
    else:
        print(f"Failed to download. Status: {r.status_code}")
        # Try master branch
        url_master = "https://github.com/Snepard/Eunoic/archive/refs/heads/master.zip"
        print(f"Trying master: {url_master}")
        r2 = requests.get(url_master)
        if r2.status_code == 200:
            print("Download success (master). extracting...")
            z = zipfile.ZipFile(io.BytesIO(r2.content))
            z.extractall(".")
            if os.path.exists("Eunoic-master"):
                 os.rename("Eunoic-master", "Eunoic")
            print("Renamed to Eunoic")
        else:
             print(f"Failed master also: {r2.status_code}")

except Exception as e:
    print(f"Error: {e}")
