(function(window, jQuery) {
	var iconoSearchUrl = "http://iconosquare.com/search/",
		iconoTagUrl = "http://iconosquare.com/tag/"

	var extractFollowerFromInstagram = function() {
		var follower = ($($("div.UserProfileUserInfo ul.upuiStats li span.sCount")[1]) || {}).text();

		if (follower)
			sendMessage("from-instagram", {url: window.location.href, follower: follower});
		else {
			sendMessage("from-instagram", {url: window.location.href, follower: "0"});
		}
	};

	var extractFollowerFromTwitter = function() {
		var follower = ($("a[data-nav='followers'] .ProfileNav-value") || {}).text();

		if (follower)
			sendMessage("from-twitter", {url: window.location.href, follower: follower});
		else {
			sendMessage("from-twitter", {url: window.location.href, follower: "0"});
		}
	};

	var extractFollowerFromFacebook = function() {
		var pref = 'Followed by ',
			tmp = $("#PagesLikesCountDOMID span").text(),
			follower = "";
		if (!tmp) {
			bodyText = $('body').text();

			if (bodyText.indexOf(pref) > -1) {
				bodyText = bodyText.substr(bodyText.indexOf(pref) + pref.length);
				follower = bodyText.substring(0, bodyText.indexOf(" "));
			} else {
				console.log("facebook likes count not found.");
			}
		} else {
			follower = tmp.substring(0, tmp.indexOf(" "));
		}

		if (follower)
			sendMessage("from-facebook", {url: window.location.href, follower: follower});
		else {
			sendMessage("from-facebook", {url: window.location.href, follower: "0"});
		}
	};

	var extractSocialLinksFromBlog = function() {
		//
		var facebookLink = ($("a[href*='https://facebook.com/']")[0] || $("a[href*='http://facebook.com/']")[0] || $("a[href*='https://www.facebook.com/']")[0] || $("a[href*='http://www.facebook.com/']")[0] || {}).href,
			twitterLink = ($("a[href*='https://twitter.com/']")[0] || $("a[href*='http://twitter.com/']")[0] || $("a[href*='https://www.twitter.com/']")[0] || $("a[href*='http://www.twitter.com/']")[0] || {}).href,
			instagramLink = ($("a[href*='https://instagram.com/']")[0] || $("a[href*='http://instagram.com/']")[0] || $("a[href*='https://www.instagram.com/']")[0] || $("a[href*='http://www.instagram.com/']")[0] || {}).href;

		sendMessage("from-blog", {facebook: facebookLink, twitter: twitterLink, instagram: instagramLink});
	};

	var getResultPageLink = function(hashtag) {
		var link = ($(".tagsSearchResult li.detailTagResult a.name")[0] || {}).href,//($(".hashtag-result")[0] || {}).href, //$("div.hashtag-list-wrapper a.hashtag-result")[0]
			count = $(".media-number").text().split(" ")[0];

		if (link) {
			chrome.extension.sendMessage({
					msg: 'from-searchPage',
					link: link,
					count: count
				}, function(response) {
					//
				});
		} else {
			chrome.extension.sendMessage({
					msg: 'stop',
					func: function(id) {
						alert("Result not found on Iconosquare for the hashtag");
						chorme.tabs.remove(id);
					}
				}, function(response) {
					//
				});
		}
	};

	var getData = function(hashtag, nextMaxId, callback) {
		//
	};

	var getAllPhotos = function(hashtag, option, searchTime) {
		var baseUrl = "http://iconosquare.com/controller_nl.php";

		$.ajax({
				url: baseUrl,
				type: "GET",
				data: {
					action:"nlGetMethod",
					method:"mediasTag",
					value:hashtag
				},
				success: function(res) {
					var response = JSON.parse(res),
						data = response.data,
						nextMaxId = response.pagination.next_max_id,
						iconos = [],
						searched_at = moment(searchTime),
						continueFlag = true;

					// if (data.length > 0) {
						for (var i = 0; i < data.length; i ++ ) {
							if (option == "daily" && 
								moment(parseInt(data[i].caption.created_time) * 1000) <= searched_at) {
								continueFlag = false;
								break;
							}
							var tmp = {
									profile: "http://iconosquare.com/" + data[i].user.username,
									picture_url: "http://iconosquare.com/p/" + data[i].id,
									posted_date: moment(parseInt(data[i].caption.created_time) * 1000).format("YYYY/MM/DD HH:mm:ss")
								};
							iconos.push(tmp);
						}

						chrome.extension.sendMessage({
								msg: "from-tagPage", 
								iconos: iconos, 
								max_id: (continueFlag) ? nextMaxId : null,
								searchTime: moment().format("YYYY/MM/DD HH:mm:ss")
							}, 
							function() {
								console.log("Original photos are got and sent to background script.");
							});
					// } else {

					// }
				}
			});
	};

	var getPostDateOnPictureUrl = function() {
		// var strDate = $(".user-info .media-date").text(),
		// 	num = strDate.split(" ")[0],
		// 	unit = strDate.split(" ")[1],
		// 	date = moment().subtract(num, unit).format("YYYY/MM/DD H:m:s");

		var dateString = $("span.pic-created").text().replace(".", ":");

		// chrome.extension.sendMessage({
		// 		msg: "from-picture",
		// 		date: date
		// 	}, function() {
		// 		console.log("Date sent to background script.");
		// 	});

		chrome.extension.sendMessage({
				msg: "from-picture",
				date: moment(dateString).format("YYYY/MM/DD H:m:s")
			}, function() {
				console.log("Date sent to background script.");
			});
	};

	var getInfoFromIconoProfile = function() {
		// var medias = ($($(".dynamic-number")[0]) || {}).text(),
		// 	followers = ($($(".dynamic-number")[1]) || {}).text(),
		// 	websiteLink = ($("a.user-site")[0] || {}).href,
		// 	blockList = ["www.youtube.com", "youtube.com", "youtu.be", "www.youtu.be"];

		var medias = ($($(".user-action span.chiffre")[2]) || {}).text(),
			followers = ($($(".user-action span.chiffre")[1]) || {}).text(),
			websiteLink = ($("a.website-link")[0] || {}).href,
			blockList = ["www.youtube.com", "youtube.com", "youtu.be", "www.youtu.be"];

		if (websiteLink) {
			var loc = new URL(websiteLink);
			if (blockList.indexOf(loc.hostname) > 0) {
				websiteLink = null;
			}
		}
		chrome.extension.sendMessage({
				msg: "from-profile",
				medias: medias,
				followers: followers,
				website: websiteLink
			}, function() {
				console.log("Media count and followers not found.");
			});
	};

	$(document).ready(function() {

		chrome.extension.sendMessage({
				msg: 'state'
			}, function(response) {
				if (response.status == "started") {
					var url = window.location,
						invalidPath = "chrome://extensions/?id=gjeefiehlfindhmdkmcncdhklfapibgb",
						searchTime = response.hashtag.updated_at;

					switch(url.hostname) {
						case "iconosquare.com":
						case "www.iconosquare.com":
							switch(url.pathname) {
								case new URL(response.searchTabUrl || invalidPath).pathname:
									getResultPageLink(response.hashtag.name);
									break;

								case new URL(response.tagPageTabUrl || invalidPath).pathname:
									getAllPhotos(response.hashtag.name, response.option, searchTime);
									break;

								case new URL(response.pictureTabUrl || invalidPath).pathname:
									getPostDateOnPictureUrl();
									break;

								case new URL(response.profileTabUrl || invalidPath).pathname:
									getInfoFromIconoProfile();
									break;

								default:
									console.log("You opened a page of iconosquare independent to BOT.");
							}
							break;

						case new URL(response.blogTabUrl || invalidPath).hostname:
						case "www." + new URL(response.blogTabUrl || invalidPath).hostname:
						case (new URL(response.blogTabUrl || invalidPath).hostname).substr("www.".length):
							extractSocialLinksFromBlog();
							break;

						case "www." + new URL(response.facebookTabUrl || invalidPath).hostname:
						case new URL(response.facebookTabUrl || invalidPath).hostname:
						case new URL(response.facebookTabUrl || invalidPath).hostname.substr("www.".length):
							if (url.pathname == new URL(response.facebookTabUrl || invalidPath).pathname ||
								response.sender_id == response.facebookTabId)
								extractFollowerFromFacebook();
							else
								console.log("Unknown facebook profile was opened.");
							break;

						case new URL(response.twitterTabUrl || invalidPath).hostname:
						case "www." + new URL(response.twitterTabUrl || invalidPath).hostname:
						case new URL(response.twitterTabUrl || invalidPath).hostname.substr("www.".length):
							if (url.pathname == new URL(response.twitterTabUrl || invalidPath).pathname ||
								response.sender_id == response.twitterTabId)
								extractFollowerFromTwitter();
							else
								console.log("Unknown twitter page was opened.");
							break;

						case "instagram.com":
						case "www.instagram.com":
							if (url.pathname == new URL(response.instagramTabUrl || invalidPath).pathname ||
								response.sender_id == response.instagramTabId)
								extractFollowerFromInstagram();
							else
								console.log("Unknown instagram page was opened.");
							break;

						default:
							console.log("unknown url was detected.");
							break;
					}

					// switch(url) {
					// 	case response.searchTabUrl:
					// 		getResultPageLink(response.hashtag.name);
					// 		break;

					// 	case response.pictureTabUrl:
					// 		getPostDateOnPictureUrl();
					// 		break;

					// 	case response.profileTabUrl:
					// 		getInfoFromIconoProfile();
					// 		break;

					// 	case response.blog:
					// 		extractSocialLinksFromBlog();
					// 		break;

					// 	case response.facebookTabUrl:
					// 		extractFollowerFromFacebook();
					// 		break;

					// 	case response.twitterTabUrl:
					// 		extractFollowerFromTwitter();
					// 		break;

					// 	case response.instagramTabUrl:
					// 		extractFollowerFromInstagram();
					// 		break;

					// 	default:
					// 		console.log("unknown url was detected.");
					// 		break;
					// }
				}
			});
					
	});
})(window, $)