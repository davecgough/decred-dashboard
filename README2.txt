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
	- footer?
	- strict request validation
	- Production: 
		- https (LetsEncrypt) https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-14-04
		- postgres on local NIC only
		- nginx
		- analytics
		- robots
		- seo
