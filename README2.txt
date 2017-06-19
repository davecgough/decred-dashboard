API:
	/day_price
		- Called by Day/Week charts
		- Data from Prices table 
	/prices
		- Called by Month/Year/All charts
		- Data from market-cap.json (held in-mem cache)
	/get_stats
		- Called periodically by main page
		- Data from Stats table
	/convert
		- Called by converter
		- Returns data from rates.json (held in-mem cache) 
		- Also uses currencies.json

CronJobs:
	updateStats
		- Get data from polo/bitstamp and saves in Stats table
	updatePrices
		- Generate Price table rows based on Stats table
	updateMarketCap
		- Writes market-cap.json  
	updateForexRates
		- Get data from forex.com and save in rates.json
	forexCache
		- Cache rates.json 
	forexCache
		- Cache usd rates from stats table 
	marketCapCache
		- Cache each XXX-market-cap.json 



To do:
	- README.md
	- add bitcoin and usd to converter currencies
	- usd values truncated incorrectly for eth ($234.)
	- Production: 
		- cron timings
		- nginx
		- analytics
		- robots
		- seo