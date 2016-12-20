# alamode.js
_A community-maintained library of visualizations for Mode reports_

<img style="float: left;" width="200px" src="https://www.evernote.com/shard/s58/sh/76cd3366-6c44-402b-9cd3-a325f8205641/39392e3ccc5433ef033ddf32b5c5a34b/deep/0/map.png">
<img style="float: left;" width="200px" src="https://www.evernote.com/shard/s58/sh/67635454-b29c-4892-b0f8-b74d98b55fe4/3f773fa46ba5811df9f54690b1a13437/deep/0/sunburst.png">
<img style="float: left;" width="200px" src="https://www.evernote.com/shard/s58/sh/7adead6a-bada-4aa4-9b09-fca518bd375b/38131fe3dda2d712d0f1e0f82a93b70c/deep/0/comments.png">
<img width="200px" src="https://www.evernote.com/shard/s58/sh/dbed3391-83ec-40e7-9ac8-3084a1bb6f93/f85391481ed2800d53c4ca0fb62bbbd9/deep/0/rentetion.png">


See [the gallery of visualizations](https://community.modeanalytics.com/gallery) included in this library. 

### Quick Usage

1. Open the [HTML editor](https://help.modeanalytics.com/articles/create-advanced-layouts-and-visualizations/) in a Mode report.
2. Add `alamode.js` and `alamode.css` to your report by adding these two lines to top of your report's HTML. 

	```
	<link rel="stylesheet" href="alamode.min.css">
	<script src="alamode.min.js">
	```
	
3. Add the customizable snippet for the chart you want to include and edit the options to fit your data.

	```
	alamode.sunburstChart(
		{
			html_element: "#sunburst-div",
	    	query_name: "My Sunburst Query",
	    	title: "A chart built with alamode",
	    	event_columns: ["event_1","event_2","event_3"],
	    	event_counts: "number_of_events" 
  		}
	)
	```
