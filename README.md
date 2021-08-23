# alamode.js
_A community-maintained library of visualizations for Mode reports_

<img style="float: left;" width="200px" src="https://www.evernote.com/shard/s58/sh/76cd3366-6c44-402b-9cd3-a325f8205641/39392e3ccc5433ef033ddf32b5c5a34b/deep/0/map.png">
<img style="float: left;" width="200px" src="https://www.evernote.com/shard/s58/sh/67635454-b29c-4892-b0f8-b74d98b55fe4/3f773fa46ba5811df9f54690b1a13437/deep/0/sunburst.png">
<img style="float: left;" width="200px" src="https://www.evernote.com/shard/s58/sh/7adead6a-bada-4aa4-9b09-fca518bd375b/38131fe3dda2d712d0f1e0f82a93b70c/deep/0/comments.png">
<img width="200px" src="https://www.evernote.com/shard/s58/sh/dbed3391-83ec-40e7-9ac8-3084a1bb6f93/f85391481ed2800d53c4ca0fb62bbbd9/deep/0/rentetion.png">


See [the gallery of visualizations](https://community.modeanalytics.com/gallery) included in this library. 

## Quick Usage

1. Open the [HTML editor](https://help.modeanalytics.com/articles/create-advanced-layouts-and-visualizations/) in a Mode report.
2. Add `alamode.js` and `alamode.css` to your report by adding these two lines to top of your report's HTML. 

	```
	<link rel="stylesheet" href="https://nvd3-community.github.io/nvd3/build/nv.d3.css">
	<script src="https://nvd3-community.github.io/nvd3/build/nv.d3.js"></script>
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

## Making Changes
Great! You've created a branch and you've udpated `alamode.js` or `alamode.css` but you're probably wondering how to minify your changes and get them into production. The steps below outline how to minify your code and how to get your changes live. 

### Minification
If you've made changes to `alamode.js`, in order to minify the file you'll need to use [UglifyJS2](https://github.com/mishoo/UglifyJS/tree/v2.x). Once you've followed the instructions for installation, you'll need to run the following command to minify `alamode.js` to `alamode.min.js`

```sh
uglifyjs --output alamode.min.js --compress --mangle -- alamode.js
```

If you've made changes to `alamode.css`, in order to minify the file you'll need to use [CSSO](https://github.com/css/csso). Once you've followed the instructions for installion, you'll need to run the following command to minify `alamode.css` to `alamode.min.css`

```sh
csso alamode.css --output alamode.min.css
```

### Geting to Production
Once your changes are minified, create a pull request against `master`. When your changes are approved, merge your branch into `master`. 

After your changes have been merged to master, you'll need to merge your changes from `master` to a branch called `gh-pages`. `gh-pages` is our production branch and once your changes are merged to it, it will be live. Follow the commands below to merge your changes from `master` to `gh-pages`: 

```sh
# from your local master branch ensure that you do a pull on master 
# this ensures that the changes that you just merged are 
# also on your local branch
git pull master

# switching to gh-pages branch
git checkout gh-pages
git merge master
git push
```

And that's it! Now your change to Alamode are live!
