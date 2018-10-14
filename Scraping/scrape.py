"""
Adapted from hyperscheduler-scraper @ https://github.com/MuddCreates/hyperschedule-scraper

Author: Tse Yang Lim
"""
import sys
import os
import json
import selenium.webdriver
import selenium.webdriver.chrome.options
import selenium.webdriver.support.ui
import re
from bs4 import BeautifulSoup

# Globals/Parameters
current_term = "FA"
portal_URL = ("https://portal.hmc.edu/ICS/Portal_Homepage.jnz?"
	   "portlet=Course_Schedules&screen=Advanced+Course+Search"
	   "&screenType=next")

# Exceptions
class ScrapeError(Exception):
	pass

def get_browser(headless):
	"""
	desc: Creates Selenium Webdriver
	param: bool, whether to use a headless Selenium webbrowser or not
	ret: Selenium webdriver
	"""
	opts = selenium.webdriver.chrome.options.Options()
	opts.set_headless(headless)
	opts.add_argument("--hide-scrollbars")
	browser = selenium.webdriver.Chrome(executable_path="./chromedriver", chrome_options=opts)
	return browser

def get_portal_html(browser):
	"""
	desc: Gets HTML source from Portal using Selenium browser. Filters are set and resultant HTML from search is obtained.
	param: Selenium webdriver
	ret: string, HTML source of portal page with all HM campus course listings for current term
	Note: portal_URL and current term (SP or FA) is already set as global
	"""
	browser.get(portal_URL)

	term_dropdown = selenium.webdriver.support.ui.Select(browser.find_element_by_id("pg0_V_ddlTerm"))
	term_names = [option.text for option in term_dropdown.options]

	# find the most recent term in the catalogues i.e. term we are interested in
	terms = []
	for term_name in term_names:
		match = re.match(r"\s*(FA|SP)\s*([0-9]{4})\s*", term_name)
		if match:
			fall_or_spring, year_str = match.groups()
			terms.append((int(year_str), fall_or_spring == current_term, term_name))

	if not terms:
		raise ScrapeError("couldn't parse any term names (from: {})".format(repr(term_names)))

	most_recent_term = max(terms)

	# actually select the term in the dropdown
	term_dropdown.select_by_visible_text(most_recent_term[2])

	# use * for title search to match all entries
	title_input = browser.find_element_by_id("pg0_V_txtTitleRestrictor")
	title_input.clear()
	title_input.send_keys("*")

	# limit to HM campus
	campus_input = selenium.webdriver.support.ui.Select(browser.find_element_by_id("pg0_V_ddlCampus"))
	campus_input.select_by_visible_text("HM Campus")

	# search
	search_button = browser.find_element_by_id("pg0_V_btnSearch")
	search_button.click()

	# show all results
	show_all_checkbox = browser.find_element_by_id("pg0_V_lnkShowAll")
	show_all_checkbox.click()

	return browser.page_source

def parse_portal_html(html):
	"""
	parses the html source and strips out course names
	param: string, HTML source code
	ret: list[string][string], of departments and their classes
	"""
	soup = BeautifulSoup(html, "lxml")

	# strip out course listings from portal table rows
	table = soup.find(id="pg0_V_dgCourses")
	if not table:
		raise ScrapeError("Could not find course list table in portal HTML")

	table_body = table.find("tbody")
	if not table_body:
		raise ScrapeError("could not find course list table body in portal HTML")

	table_rows = table_body.find_all("tr", recursive=False)
	if not table_rows:
		raise ScrapeError("could not find course list table rows body in portal HTML")

	# translate each course listing to JSON format
	raw_courses = []
	for row_idx, row in enumerate(table_rows):
		if "style" in row.attrs and row.attrs["style"] == "display:none;":
			continue
		elements = row.find_all("td")
		try:
			(add, course_code, name, faculty,
             seats, status, schedule, num_credits, begin, end) = elements
		except ValueError:
			raise ScrapeError("could not extract course list table row elements from Portal HTML (for row {})".format(row_idx))

		raw_courses.append({
			"course_code": course_code.text.strip(),
			"course_name": name.text,
			"faculty": sorted(set(re.split(r"\s*\n\s*",faculty.text.strip()))),
			"schedule": [stime.text for stime in schedule.find_all("li")],
			"begin_date": begin.text,
			"end_date": end.text
        })

	return {"courses": raw_courses}

if __name__ == "__main__":
	browser = get_browser(True)
	HM_course_html = get_portal_html(browser)
	raw_courses = parse_portal_html(HM_course_html)
	with open("courses.json", "w") as f:
		json.dump(raw_courses, f)
