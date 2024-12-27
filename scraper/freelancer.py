from bs4 import BeautifulSoup
import urllib.request
import re
import pymongo  

# Load the webpage
url = 'https://www.freelancer.com/job/'
html = urllib.request.urlopen(url)
webpage = BeautifulSoup(html, 'html.parser')

# MongoDB connection setup
client = pymongo.MongoClient("mongodb+srv://agrawaldev31997:4iTDn26AZlvFKtN1@gigworld.ugv43.mongodb.net/Gigworld?retryWrites=true&w=majority")  # Connect to MongoDB
db = client['Gigworld']  # Database name
collection = db['jobs']  # Collection name where job data will be stored

# Create a dataset list to store job entries
dataset = []

# Website name to include in the dataset
website_name = 'freelancer.com'

# Scrape data for each job
for job_section in webpage.find_all("section", attrs={"class": "job-section-class"}):  # Replace 'job-section-class' with the correct class
    try:
        # Extract job details
        job_title = job_section.find("h2", class_="job-title-class").get_text(strip=True)  # Replace 'job-title-class' with correct class
        company_name = job_section.find("div", class_="company-name-class").get_text(strip=True)  # Replace with correct class
        rating = job_section.find("span", class_="rating-class").get_text(strip=True)  # Replace with correct class
        ex_wrap = job_section.find("span", class_="experience-class").get_text(strip=True)  # Replace with correct class
        location = job_section.find("span", class_="location-class").get_text(strip=True)  # Replace with correct class
        min_requirements = job_section.find("div", class_="requirements-class").get_text(strip=True)  # Replace with correct class
        all_tech_stack = [tech.get_text(strip=True) for tech in job_section.find_all("span", class_="tech-stack-class")]  # Replace with correct class

        # Create a job entry
        job_entry = {
            "Skill": None,  # Update if applicable
            "Jobs": None,  # Update if applicable
            "Category": None,  # Update if applicable
            "Website": website_name,
            "Job_Title": job_title,
            "Company_Name": company_name,
            "Rating": rating,
            "Experience": ex_wrap,
            "Location": location,
            "Min_Requirements": min_requirements,
            "Tech_Stack": all_tech_stack,
        }

        # Append to dataset
        dataset.append(job_entry)

    except AttributeError as e:
        print(f"Error extracting job details: {e}")
        continue

# Insert the dataset into MongoDB collection
if dataset:
    collection.insert_many(dataset)  # Insert all job entries
    print(f"{len(dataset)} job records inserted into MongoDB.")
else:
    print("No data to insert into MongoDB.")
