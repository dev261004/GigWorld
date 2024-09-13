from bs4 import BeautifulSoup
import urllib.request
import re
import pymongo  # To interact with MongoDB
import sys

# Load the webpage
url = 'https://www.freelancer.com/job/'
html = urllib.request.urlopen(url)
webpage = BeautifulSoup(html, 'html.parser')

# MongoDB connection setup
client = pymongo.MongoClient("mongodb+srv://devagrawal261004:6CreQkfi3lXZiCbq@cluster0.h1ovfru.mongodb.net/workhive_db?retryWrites=true&w=majority")  # Connect to local MongoDB
db = client['workhive_db']  # Database name
collection = db['jobs']  # Collection name where job data will be stored

# Create a dataset list to store job entries
dataset = []

# Find and debug the category section
for category in webpage.find_all("section", attrs={"class": "PageJob-category"}):
    myCategory = category.find("h3", attrs={"class": "PageJob-category-title"})

    # If the category header is not found, skip this section
    if not myCategory:
        print("Category header not found, skipping.")
        continue

    myCategory = myCategory.get_text()

    # Iterate through each grid in the category
    for grid in category.find_all("ul", attrs={"class": "PageJob-browse-list Grid"}):
        for element in grid.find_all("a", attrs={"class": re.compile(r"PageJob-category-link")}):

            # Print out the raw element to debug
            print(f"Raw element text: {element.get_text().strip()}")

            # Try to extract name and jobs using regular expressions
            try:
                # Debugging: print the raw text to understand the structure
                text = element.get_text().strip()
                print(f"Extracting from text: '{text}'")

                # Use a more flexible regex pattern to handle edge cases
                match = re.search(r"([^\(]+)\s*\((\d+)\)", text)
                if match:
                    name, jobs = match.groups()
                    
                    # Create a job entry
                    job_entry = {
                        "Skill": name.strip(),
                        "Jobs": int(jobs.strip()),  # Convert to integer for numeric field
                        "Category": myCategory[:myCategory.rfind("(")].strip()
                    }
                    
                    # Append to dataset
                    dataset.append(job_entry)
                else:
                    print(f"No match found for text: {text}")
            except (IndexError, ValueError):
                print(f"Could not extract data from element: {element.get_text()}")
                continue

# Insert the dataset into MongoDB collection
if dataset:
    collection.insert_many(dataset)  # Insert all job entries
    print(f"{len(dataset)} job records inserted into MongoDB.")
else:
    print("No data to insert into MongoDB.")
