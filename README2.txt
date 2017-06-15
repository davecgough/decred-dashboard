API:
	/day_price
		- Called by Day/Week charts
		- Data from Prices table 
	/prices
		- Called by Month/Year/All charts
		- Data from market-cap.json 
	/get_stats
		- Called periodically by main page
		- Data from Stats table
	/convert
		- Called by converter
		- Returns data from rates.json (held in-mem cache) 
		- Also uses currencies.json

CronJobs:
	updatePrices
		- Get data from polo/bitstamp and saves in Stats table
	updateMarketCap
		- Writes market-cap.json and generates Price table data from Stats table
	updateExchangeRates
		- Get data from XX.com and save in rates.json

To do:
	- README.md
	- nginx
	- favicon
	- add bitcoin and usd to converter currencies
