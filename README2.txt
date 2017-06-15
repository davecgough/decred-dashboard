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

CronJobs:
	updatePrices:
		- Get data from polo/bitstamp and saves in Stats table
	updateMarketCap2:
		- Writes market-cap.json and generates Price table data from Stats table

To do:
	- sitemap.xml
	- README.md
	- seo.json
	- 404
	- nginx