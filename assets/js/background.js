(function(window, jQuery){
	chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {

		switch(request.msg) {
			case "start":
				console.log("App is starting in " + request.option + " mode.");
				IconosquareBot.start(request.hashtag, request.option, sendResponse);
				break;

			case "restart":
				console.log("App is starting in " + request.option + " mode.");
				IconosquareBot.restart(request.hashtag, request.option, sendResponse);
				break;

			case "state":
				console.log("Checking the current status.");
				var state = IconosquareBot.getState();
				if (sender.tab)
					state['sender_id'] = sender.tab.id;
				else
					state['sender_id'] = sender.id;
				sendResponse(state);
				break;
			case "stop":
				IconosquareBot.stop(sendResponse);
				if (request.func) {
					request.func(sender.tab.id);
				}
				break;

			case "from-searchPage":
				IconosquareBot.checkTagPage(request.link, request.count);
				chrome.tabs.remove(sender.tab.id, function() {
					IconosquareBot.searchTabUrl = null;
					IconosquareBot.searchTabId = null;
				});
				break;

			case "from-tagPage":
				IconosquareBot.getAllPhotos(request.iconos, request.max_id, request.searchTime, true);
				chrome.tabs.remove(sender.tab.id, function() {
					IconosquareBot.tagPageTabUrl = null;
					IconosquareBot.tagPageTabId = null;
				});
				break;

			case "from-picture":
				var date = request.date;

				chrome.tabs.remove(sender.tab.id, function() {
					IconosquareBot.pictureTabUrl = null;
					IconosquareBot.pictureTabId = null;
				});

				console.log("Data received from picture page.");
				console.log(request.date);

				if (date) {
					IconosquareBot.setPostDate(date);
				} else {
					console.log("Posted date should not be null. Please check again.");
					IconosquareBot.setPostDate("");
				}
				break;

			case "from-profile":
				var params = {
						medias: request.medias,
						followers: request.followers,
						website: request.website
					};

				chrome.tabs.remove(sender.tab.id, function() {
					IconosquareBot.profileTabUrl = null;
					IconosquareBot.profileTabId = null;
				});

				console.log("Data received from profile page.");
				console.log(params);

				IconosquareBot.setProfileData(params);
				break;

			case "from-blog":
				var params = {
						facebook: request.data.facebook,
						twitter: request.data.twitter,
						instagram: request.data.instagram
					};

				IconosquareBot.setSocialLinks(params);
				chrome.tabs.remove(sender.tab.id, function() {
					IconosquareBot.blogTabUrl = null;
					IconosquareBot.blogTabId = null;
				});

				console.log("Data received from Blog page.");
				console.log(params);
				break;

			case "from-facebook":
				var params = {
						facebook: request.data.url,
						facebook_follower: request.data.follower
					};

				IconosquareBot.setFacebookData(params);
				chrome.tabs.remove(sender.tab.id, function() {
					IconosquareBot.facebookTabUrl = null;
					IconosquareBot.facebookTabId = null;
				});

				console.log("Data received from Facebook");
				console.log(sender.tab);
				console.log(params);
				break;

			case "from-twitter":
				var params = {
						twitter: request.data.url,
						twitter_follower: request.data.follower
					};

				IconosquareBot.setTwitterData(params);
				// IconosquareBot.setFacebookData(params);
				chrome.tabs.remove(sender.tab.id, function() {
					IconosquareBot.twitterTabUrl = null;
					IconosquareBot.twitterTabId = null;
				});

				console.log("Data received from Twitter");
				console.log(sender.tab);
				console.log(params);
				break;

			case "from-instagram":
				var params = {
						instagram: request.data.url,
						instagram_follower: request.data.follower
					};

				IconosquareBot.setInstagramData(params);
				chrome.tabs.remove(sender.tab.id, function() {
					IconosquareBot.instagramTabUrl = null;
					IconosquareBot.instagramTabId = null;
				});

				console.log("Data received from Instagram");
				console.log(sender.tab);
				console.log(params);
				break;

			default:
				console.log("Unknown request was found.");
				break;
		}
			
	});
})(window, $);