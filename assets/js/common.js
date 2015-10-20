var IconoAPI = {
	// base: "http://tagcash.dev:8080/api/",
	base: "http://front-end.tagcash.tv/api/",
	addHashtag: function(params, callback) {
		if (typeof callback == "function") {
			$.ajax({
					url: this.base + 'add_hashtag',
					type: "GET",
					dataType: "json",
					data: params,
					success: function(res) {
						callback(res);
					},
					error: function(x, e) {
						console.log(e);
					}
				});
		} else {
			console.log("Callback function is required..");
		}
	},

	getHashtags: function(option, callback) {
		if (typeof callback == "function") {
			$.ajax({
					url: this.base + 'get_hashtags',
					type: "GET",
					dataType: "json",
					data: {option: option},
					success: function(res) {
						callback(res);
					},
					error: function(x, e) {
						console.log(e);
					}
				});
		}
	},

	updateHashtag: function(hashtag, params, callback) {
		if (typeof callback == "function") {
			$.ajax({
					url: this.base + 'update_hashtag',
					type: "GET",
					dataType: "json",
					data: {hashtag: hashtag, date: params.date, option: params.option},
					success: function(res) {
						callback(res);
					},
					error: function(x, e) {
						console.log(e);
					}
				});
		}
	},

	addIcono: function(hashtag, icono, callback) {
		$.ajax({
			url: this.base + 'add_icono',
			type: "GET",
			dataType: "json",
			data: {
				name: hashtag, 
				picture_url: icono.picture_url, 
				profile: icono.profile,
				followers: icono.followers, 
				medias: icono.medias, 
				email: icono.email,
				facebook: icono.facebook, 
				facebook_count: icono.facebook_follower, 
				twitter: icono.twitter,
				twitter_count: icono.twitter_follower,
				instagram: icono.instagram,
				instagram_count: icono.instagram_follower,
				posted_at: icono.posted_date
			},
			success: function(res) {
				if (typeof callback == "function")
					callback(res);
				else
					console.log(res);
			},
			error: function(x, e) {
				console.log(e);
			}
		});
	},

	getIconos: function(hashtag, callback) {
		$.ajax({
			url: this.base + 'get_iconos',
			type: "GET",
			data: {hashtag: hashtag},
			dataType: "json",
			success: function(res) {
				if (typeof callback == "function")
					callback(res);
				else
					console.log(res);
			},
			error: function(x, e) {
				console.log(e);
			}
		});
	}
};

var IconosquareBot = {
	metaParams: [
					"status", 
					"option",
					"hashtags",
					"hashtags-daily",
					"results-full",
					"results-daily"
				],

	metaParamsDefauls: {
					status: "stopped", 
					option: "full",
					hashtag: {},
					hashtags: {},
					"hashtags-daily": [],
					iconosquares: [],
					iconosquare: null,
					results: [],
					"results-full": [],
					"results-daily": []
				},

	searchTabUrl: null,
	searchTabId: null,
	searchResultTabUrl: null,
	searchResultTabId: null,
	tagPageTabUrl: null,
	tagPageTabId: null,
	pictureTabUrl: null,
	pictureTabId: null,
	profileTabUrl: null,
	profileTabId: null,
	searchResultMaxDepth: 5,
	searchResultDepth: 0,
	blogTabUrl: null,
	blogTabId: null,
	blogTagTimer: null,
	facebookTabUrl: null,
	facebookTabId: null,
	twitterTabUrl: null,
	twitterTabId: null,
	instagramTabUrl: null,
	instagramTabId: null,
	nextTimer: null,

	/**
	 *
	 */
		processHashtag: function(hashtag, option) {
			var self = IconosquareBot;
			
			if (option == "full") {
				chrome.tabs.create({url: "http://iconosquare.com/search/" + hashtag.name}, function(tab) {
					self.searchTabUrl = tab.url;
					self.searchTabId = tab.id;
				});
			} else if (option == "daily") {
				var hashtags = self.getState("hashtags-daily"),
					hashtag = hashtags.shift();

				self.saveState("hashtag", hashtag);
				self.saveState("hashtags-daily", hashtags);

				if (!hashtag) {
					self.saveState("hashtag", null);
					alert("Daily search was successfully completed.");
					self.stop();
				} else {
					chrome.tabs.create({url: "http://iconosquare.com/search/" + hashtag.name}, function(tab) {
						self.searchTabUrl = tab.url;
						self.searchTabId = tab.id;
					});
				}
			}
		},

		startDailySearch: function(hashtags, callback) {
			var self = this;
			$.each(hashtags, function(key, value) {
				if (value.search_option == "daily") {
					self.addHashtag(value);
				}
			});

			self.processHashtag(null, "daily");
		},

		addHashtag: function(value) {
			var self = this,
				prevHashtags = self.getState("hashtags-daily");
			prevHashtags.push(value);
			self.saveState("hashtags-daily", prevHashtags);
		},

		addIconosquares: function(hashtag, next_max_id) {
			var params = {action:"nlGetMethod",method:"mediasTag", value: hashtag},
				self = IconosquareBot;

			if (next_max_id) {
				params['max_id'] = next_max_id;
			}

			$.ajax({url:"http://iconosquare.com/controller_nl.php",
				type: "get",
				dataType: "json",
				data: params,
				success: function(response){
					var data = response.data || [],
						iconos = [],
						baseUrl = "http://iconosquare.com/"
					if (data.length > 0) {
						self.searchResultDepth++;
						for (var i = 0; i < data.length; i ++ ) {
							var icono = {
								picture_url: baseUrl + "p/" + data[i].id,
								profile: baseUrl + data[i].user.username
							};
							iconos.push(icono);
						}
						if (self.getState("iconosquares").length == 0) {
							self.saveState("iconosquares", self.getState("iconosquares").concat(iconos));
							self.checkIconosquare();
						} else {
							self.saveState("iconosquares", self.getState("iconosquares").concat(iconos));
						}
						
						// if (self.searchResultDepth < self.searchResultMaxDepth && response.pagination.next_max_id != undefined) {
						if (response.pagination.next_max_id != undefined) {
							self.addIconosquares(hashtag, response.pagination.next_max_id);
						}
					}
				}
			});
		},

		checkTagPage: function(link, count) {
			var self = this;
			if (link) {
				chrome.tabs.create({url: link}, function(tab) {
					self.tagPageTabUrl = tab.url;
					self.tagPageTabId = tab.id;
				});
			}
		},

		getAllPhotos: function(iconos, maxId, searchTime, startFlag) {
			var arr = [],
				self = this,
				hashtag = self.getState("hashtag"),
				option = self.getState("option");
			if (!maxId) {
				if (iconos.length > 0) {
					self.saveState("iconosquares", self.getState("iconosquares").concat(iconos));

					if (startFlag) {
						hashtag.updated_at = searchTime;
						self.saveState("hashtag", hashtag);
						IconoAPI.updateHashtag(
							hashtag.name, 
							{
								date: searchTime
							},
							function(res) {
								console.log(res);
							});
						self.checkIconosquare();
					}
				} else {
					if (startFlag) {
						hashtag.updated_at = searchTime;
						self.saveState("hashtag", hashtag);
						IconoAPI.updateHashtag(
							hashtag.name, 
							{
								date: searchTime
							},
							function(res) {
								console.log(res);
							});
						if (option == "full") {
							self.stop();
							alert("Photos not found for the hashtag.");
						} else if (option == "daily") {
							self.processHashtag(null, "daily");
						} else {
							alert("Unknown stop case found. Check now.");
							self.stop();
						}
					}
				}
			}
			else if (iconos.length == 0) {//} || self.getState("iconosquares").length > 50) {
				console.log("All photos are grabed.");
			} else {

				self.saveState("iconosquares", self.getState("iconosquares").concat(iconos));

				if (startFlag) {
					hashtag.updated_at = searchTime;
					self.saveState("hashtag", hashtag);
					IconoAPI.updateHashtag(
						hashtag.name, 
						{
							date: searchTime
						},
						function(res) {
							console.log(res);
						});
					self.checkIconosquare();
				}

				var url = "http://iconosquare.com/controller_nl.php";
				$.ajax({
						url: url,
						type: "GET",
						data: {
							action: "nlGetMethod",
							method: "mediasTag",
							value: self.getState("hashtag").name,
							max_id: maxId
						},
						success: function(responseText) {
							var response = JSON.parse(responseText),
								data = response.data,
								nextMaxId = response.pagination.next_max_id,
								iconos = [],
								searched_at = moment(hashtag.updated_at),
								continueFlag = true;
							for (var i = 0; i < data.length; i ++ ) {
								if (option == "daily" && 
									moment(parseInt(data[i].caption.created_time) * 1000) <= searched_at) {
									continueFlag = false;
									break;
								}
								var tmp = {
										profile: "http://iconosquare.com/" + data[i].user.username,
										picture_url: "http://iconosquare.com/p/" + data[i].id,
										posted_date: (data[i].caption) 
													? moment(parseInt(data[i].caption.created_time) * 1000).format("YYYY/MM/DD HH:mm:ss")
													: moment().format("YYYY/MM/DD HH:mm:ss")
									};
								iconos.push(tmp);
							}
							if (continueFlag)
								self.getAllPhotos(iconos, response.pagination.next_max_id, searchTime);
							else
								self.getAllPhotos(iconos, null, searchTime);
							console.log("Here");
						},
						error: function(xhr, txtStatus, e) {

							console.log("An error occurs...");
						}
					});
			}
		},

		grabAllPhotos: function(link, count) {
			var self = IconosquareBot;

			if (link && count) {
				self.saveState("searchResult", {link: link, count: count});
				self.addIconosquares(self.getState("hashtag").name);
			} else {
				if (self.getState().option == "full") {
					self.stop();
				}
			}
		},

		checkPictureUrl: function(url) {
			var self = this;
			chrome.tabs.create({url: url}, function(tab) {
				self.pictureTabUrl = tab.url;
				self.pictureTabId = tab.id;
			});
		},

		setPostDate: function(date) {
			var self = this,
				icono = self.getState("iconosquare");

			icono.posted_date = date;
			self.saveState("iconosquare", icono);
		},

		checkProfile: function(url) {
			var self = this;
			chrome.tabs.create({url: url}, function(tab) {
				self.profileTabUrl = tab.url;
				self.profileTabId = tab.id;
			});
		},

		setProfileData: function(params) {
			var self = this,
				icono = self.getState("iconosquare");
			
			if (params.medias)
				icono.medias = params.medias;
			else
				icono.medias = "0";

			if (params.followers)
				icono.followers = params.followers;
			else
				icono.followers = "0";

			if (params.website)
				icono.website = params.website;

			self.saveState("iconosquare", icono);

			if (self.isReadyForBlog()) {
				self.checkWebsite();
			} else {
				var blogTimer = setInterval(function() {
						if (self.isReadyForBlog()) {
							clearInterval(blogTimer);
							blogTimer = null;
							self.checkWebsite();
						}
					}, 100);
			}
		},
	/*		*/

	/**
	 *	Social research module
	 */
		checkSocialWebsites: function(flag) {
			this.checkFacebook(flag);
			this.checkTwitter(flag);
			this.checkInstagram(flag);
		},

		checkFacebook: function(flag) {
			var self = this,
				icono = this.getState("iconosquare");
			if (flag) {
				icono.blog = "Unknown";
				icono.twitter = "Unknown";
				icono.instagram = "Unknown";

				self.saveState("iconosquare", icono);
			}

			if (icono.facebook) {
				chrome.tabs.create({url:icono.facebook}, function(tab) {
						self.facebookTabUrl = tab.url;
						self.facebookTabId = tab.id;
					});
			} else {
				icono.facebook = "Unknown";
				icono.facebook_follower = "0";
				self.saveState("iconosquare", icono);
				self.standByForNext();
			}
		},

		setFacebookData: function(params) {
			var self = this,
				icono = self.getState("iconosquare");
			icono.facebook = params.facebook;
			icono.facebook_follower = params.facebook_follower;
			self.saveState("iconosquare", icono);

			self.standByForNext();
		},

		checkTwitter: function(flag) {
			var self = this,
				icono = this.getState("iconosquare");
			if (flag) {
				icono.blog = "Unknown";
				icono.instagram = "Unknown";
				icono.facebook = "Unknown";

				self.saveState("iconosquare", icono);
			}

			if (icono.twitter) {
				chrome.tabs.create({url:icono.twitter}, function(tab) {
						self.twitterTabUrl = tab.url;
						self.twitterTabId = tab.id;
					});
			} else {
				icono.twitter = "Unknown";
				icono.twitter_follower = "0";
				self.saveState("iconosquare", icono);
				self.standByForNext();
			}
		},

		setTwitterData: function(params) {
			var self = this,
				icono = self.getState("iconosquare");
			icono.twitter = params.twitter;
			icono.twitter_follower = params.twitter_follower;
			self.saveState("iconosquare", icono);
			self.standByForNext();
		},

		checkInstagram: function(flag) {
			var self = this,
				icono = this.getState("iconosquare");
			if (flag) {
				icono.blog = "Unknown";
				icono.twitter = "Unknown";
				icono.facebook = "Unknown";

				self.saveState("iconosquare", icono);
			}

			if (icono.instagram) {
				chrome.tabs.create({url:icono.instagram}, function(tab) {
						self.instagramTabUrl = tab.url;
						self.instagramTabId = tab.id;
					});
			} else {
				icono.instagram = "Unknown";
				icono.instagram_follower = "0";
				self.saveState("iconosquare", icono);
				self.standByForNext();
			}
		},

		standByForNext: function() {
			var self = this;

			if (!self.nextTimer) {
				self.nextTimer = setInterval(function() {
					if (self.isReadyForNext()) {
						self.moveToNextIcono();
						clearInterval(self.nextTimer);
						self.nextTimer = null;
					}
				}, 500);
			}
		},

		addIconoToDB: function(icono, callback) {
			var hashtag = IconosquareBot.getState("hashtag");
			IconoAPI.addIcono(hashtag.name, icono, function(res) {
				if (typeof callback == "function") {
					callback(res);
				} else {
					console.log(res);
				}
			});
		},

		moveToNextIcono: function() {
			var self = IconosquareBot,
				icono = self.getState("iconosquare"),
				tempResults = self.getState("results");

			self.saveState("iconosquare", null);
			self.addIconoToDB(icono, function(res) {
				if (res.status == "ok") {
					tempResults.push(icono);
					self.saveState("results", tempResults);
				} else if (res.status == "bad") {
					tempResults.push(icono);
					self.saveState("results", tempResults);
					console.log("Icono duplication found.");
				} else {
					console.log("Unknown test case found in adding icono to DB.");
				}
				self.checkIconosquare();
			});
		},

		setInstagramData: function(params) {
			var self = this,
				icono = self.getState("iconosquare");
			icono.instagram = params.instagram;
			icono.instagram_follower = params.instagram_follower;
			self.saveState("iconosquare", icono);

			self.standByForNext();
		},

		checkBlog: function() {
			var self = this,
				icono = self.getState("iconosquare"),
				blockList = ["www.youtube.com", "youtube.com", "youtu.be", "www.youtu.be", "m.youtube.com"];
			if (icono.blog && blockList.indexOf(new URL(icono.blog).hostname) < 0) {
				chrome.tabs.create({url: icono.blog}, function(tab) {
					self.blogTabUrl = tab.url;
					self.blogTabId = tab.id;
					self.blogTimer = setTimeout(function() {
						if (self.blogTabUrl && self.blogTabUrl == tab.url) {
							chrome.tabs.remove(tab.id);
							self.blogTabUrl = null;
							self.blogTabId = null;
							
							var tempIcono = self.getState("iconosquare");
							tempIcono.facebook = "Unknown";
							tempIcono.facebook_follower = "0";
							tempIcono.twitter = "Unknown";
							tempIcono.twitter_follower = "0";
							tempIcono.instagram = "Unknown";
							tempIcono.instagram_follower = "0";
							self.saveState("iconosquare", tempIcono);
							self.standByForNext();
						}
					}, 30000);
				});
			} else {
				icono.blog = "Not found";
				icono.facebook = "Not found";
				icono.facebook_follower = "0";
				icono.twitter = "Not found";
				icono.twitter_follower = "0";
				icono.instagram = "Not found";
				icono.instagram_follower = "0";

				self.saveState("iconosquare", icono);
				if (self.isReadyForNext()) {
					self.moveToNextIcono();
				} else {
					alert("Unexpected error occurs while moving to next iconosquare.");
					self.saveState("iconosquare", null);
					var tempResults = self.getState("results");
					tempResults.push(icono);
					self.saveState("results", tempResults);
					self.checkIconosquare();
				}
			}
		},

		setSocialLinks: function(params) {
			var icono = this.getState("iconosquare");
			icono.facebook = params.facebook;
			icono.twitter = params.twitter;
			icono.instagram = params.instagram;
			this.saveState("iconosquare", icono);
			this.checkSocialWebsites();
		},

		checkWebsite: function() {
			var self = this,
				icono = this.getState("iconosquare");

			if (icono.website) {
				var url = new URL(icono.website);
				switch (url.hostname) {
					case "facebook.com":
						icono.facebook = icono.website;
						icono.blog = "Unknown";
						icono.twitter = "Unknown";
						icono.twitter_follower = "0";
						icono.instagram = "Unknown";
						icono.instagram_follower = "0";
						this.saveState("iconosquare", icono);
						self.checkFacebook(true);
						break;

					case "twitter.com":
						icono.twitter = icono.website;
						icono.blog = "Unknown";
						icono.facebook = "Unknown";
						icono.facebook_follower = "0";
						icono.instagram = "Unknown";
						icono.instagram_follower = "0";
						this.saveState("iconosquare", icono);
						self.checkTwitter(true);
						break;

					case "instagram.com":
						icono.instagram = icono.website;
						icono.blog = "Unknown";
						icono.facebook = "Unknown";
						icono.facebook_follower = "0";
						icono.twitter = "Unknown";
						icono.twitter_follower = "0";
						this.saveState("iconosquare", icono);
						self.checkInstagram(true);
						break;

					case "iconosquare.com":
						icono.blog = null;
						this.saveState("iconosquare", icono);
						this.checkBlog();
						break;

					default:
						icono.blog = icono.website;
						this.saveState("iconosquare", icono);
						self.checkBlog();
						break;
				}
			} else {
				icono.blog = "Not found";
				icono.facebook = "Not found";
				icono.facebook_follower = "0";
				icono.twitter = "Not found";
				icono.twitter_follower = "0";
				icono.instagram = "Not found";
				icono.instagram_follower = "0";
				var tempResults = self.getState("results");
				tempResults.push(icono);
				self.saveState("results", tempResults);
				self.saveState("iconosquare", null);
				self.checkIconosquare();
			}
		},

		isReadyForBlog: function() {
			var icono = this.getState("iconosquare");

			return (icono.posted_date &&
					icono.picture_url &&
					icono.profile &&
					icono.followers &&
					icono.medias);
		},
	/*	End of social management methods	*/

	/**
	 *
	 */

		isReadyForNext: function() {
			var icono = this.getState("iconosquare");
			return (icono.blog && 
					icono.facebook && icono.facebook_follower && 
					icono.twitter && icono.twitter_follower && 
					icono.instagram && icono.instagram_follower);
		},

		checkIconosquare: function() {
			var self = IconosquareBot,
				hashtag = self.getState("hashtag"),
				iconosquares = self.getState("iconosquares"),
				icono = iconosquares.shift();
			self.saveState("iconosquares", iconosquares)
			self.saveState("iconosquare", icono);
			
			if (icono && icono != "done") {
				icono.hashtag = hashtag.name;
				self.saveState("iconosquare", icono);
				if (!icono.posted_date)
					self.checkPictureUrl(icono.picture_url);
				self.checkProfile(icono.profile);
			} else {
				if (self.getState().option == "full") {
					self.saveState("iconosquare", "done");
					IconoAPI.updateHashtag(hashtag.name, {option: "daily"}, function(res) {
						alert("All things are done for " + self.getState().hashtag.name);
						self.stop();
						console.log(res);
					});
				} else if (self.getState().option == "daily") {
					// alert("Please write code to move next in daily mode.");
					self.processHashtag(null, "daily");
				} else {
					console.log("Unknown case found.");
					self.stop();
				}
			}
		},
	/*	End of full search mode */


	/**
	 *	BOT control methods
	 */
		start: function(hashtag, option, callback, force) {
			this.saveState("option", option);
			this.saveState("status", "started");
			this.searchResultDepth = 0;

			var hashtags = {},
				self = this;

			IconoAPI.getHashtags(null, function(res) {
				hashtags = IconosquareBot.processHashtags(res);
				var curHashtag = hashtags[hashtag];

				if (option == "full") {
					if (curHashtag) {
						if (curHashtag.search_option == "full") {

							if (self.getState("hashtag").name == hashtag && (!force)) {
								self.resume(curHashtag, option, callback);
							} else {
								self.saveState("hashtag", curHashtag);
								self.saveState("iconosquare", null);
								self.saveState("iconosquares", null);
								self.processHashtag(curHashtag, option);

								if (typeof callback == "function") {
									callback({data: "started", msg: "Successfully started with " + 
												hashtag + " in " + option + " mode."});
								}
							}
						} else if (curHashtag.search_option == "daily") {
							if (typeof callback == "function") {
								self.stop();
								alert("Already exists and done in full mode. Please search in daily mode.");
								callback({data: "exist", msg: "Already exists. Please search in daily mode."});
							}
						}
					} else {
						IconoAPI.addHashtag({name: hashtag}, function(response) {
							if (response.status == "ok" && response.value) {
								hashtags[hashtag] = {
										name: hashtag,
										picture_count: 0,
										contact_count: 0,
										search_option: "full",
										updated_at: null
									};

								self.saveState("hashtags", hashtags);
								self.saveState("hashtag", hashtags[hashtag]);
								self.saveState("iconosquare", null);
								self.saveState("iconosquares", null);
								self.processHashtag(self.getState("hashtag"), option);
								if (typeof callback == "function") {
									callback({data: "started", msg: "Successfully started in " + option + " mode."});
								}
							} else {
								if (typeof callback == "function") {
									callback({data: "error", msg: "Failed to add the hashtag."});
								}
							}
						});
					}
					
				} else if (option == "daily") {
					self.startDailySearch(hashtags, callback);
				}
			});
		},

		resume: function(hashtag, option, callback) {
			var self = this,
				iconosquares = self.getState("iconosquares"),
				hashtag = self.getState("hashtag"),
				icono = self.getState("iconosquare");

			if (icono == "done") {
				if (hashtag.updated_at) {
					self.stop();
					alert("All things are done in full search mode. You can try in daily mode later...");
				} else {
					self.processHashtag(hashtag, option)
				}
			} else if (icono) {
				if (!icono.posted_date)
					self.checkPictureUrl(icono.picture_url);
				self.checkProfile(icono.profile);
			} else {
				self.checkIconosquare();
			}
		},

		initBot: function(hashtag, option, callback) {
			self = this;

			self.closeAllTabs();
			IconoAPI.updateHashtag(hashtag, {option: "full", date: "NULL"}, function(res) {
				if (res.status == "ok") {
					self.saveState("iconosquare", null);
					self.saveState("iconosquares", []);
					self.saveState("results", []);
				} else {
					alert("Some db error found.");
					self.stop();
				}
				if (typeof callback == "function") {
					callback();
				}
			});
		},

		closeAllTabs: function() {
			var self = this;

			if (self.searchTabId) {
				chrome.tabs.remove(self.searchTabId);
				self.searchTabId = null;
				self.searchTabUrl = null;
			}

			if (self.tagPageTabId) {
				chrome.tabs.remove(self.tagPageTabId);
				self.tagPageTabId = null;
				self.tagPageTabUrl = null;
			}

			if (self.profileTabId) {
				chrome.tabs.remove(self.profileTabId);
				self.profileTabId = null;
				self.profileTabUrl = null;
			}

			if (self.pictureTabId) {
				chrome.tabs.remove(self.pictureTabId);
				self.pictureTabId = null;
				self.pictureTabUrl = null;
			}

			if (self.blogTabId) {
				chrome.tabs.remove(self.blogTabId);
				self.blogTabId = null;
				self.blogTabUrl = null;
			}

			if (self.facebookTabId) {
				chrome.tabs.remove(self.facebookTabId);
				self.facebookTabId = null;
				self.facebookTabUrl = null;
			}

			if (self.twitterTabId) {
				chrome.tabs.remove(self.twitterTabId);
				self.twitterTabId = null;
				self.twitterTabUrl = null;
			}

			if (self.instagramTabId) {
				chrome.tabs.remove(self.instagramTabId);
				self.instagramTabId = null;
				self.instagramTabUrl = null;
			}
		},

		restart: function(hashtag, option, callback) {
			var self = this;

			self.initBot(hashtag, option, function() {
				self.start(hashtag, option, callback, true);
			});
		},

		stop: function(callback) {
			this.closeAllTabs();
			this.saveState("status", "stopped");
			if (typeof callback == "function") {
				callback({data: "stopped", msg: "Successfully stopped."});
			}
		},
	/*	End of BOT Control methods */


	/**
	 *	BOT State management methods
	 */
		saveState: function(keyword, value) {
			if (IconosquareBot.metaParams.indexOf(keyword) != -1) {
				localStorage.setItem(keyword, JSON.stringify(value));
			} else {
				localStorage.setItem(keyword + "-" + IconosquareBot.getState("option"), JSON.stringify(value));
			}
		},

		getState: function(keyword) {
			var self = IconosquareBot;

			if (keyword == undefined) {
				return {
					status: self.getState("status") || self.metaParamsDefauls["status"],
					option: self.getState("option") || self.metaParamsDefauls["option"],
					hashtag: self.getState("hashtag") || self.metaParamsDefauls["hashtag"],
					"static-hashtag": (JSON.parse(localStorage.getItem("hashtag-full")) || {}).name,
					hashtags: self.getState("hashtags") || self.metaParamsDefauls["hashtags"],
					searchTabUrl: self.searchTabUrl,
					searchResultTabUrl: self.searchResultTabUrl,
					tagPageTabUrl: self.tagPageTabUrl,
					pictureTabUrl: self.pictureTabUrl,
					pictureTabId: self.pictureTabId,
					profileTabUrl: self.profileTabUrl,
					profileTabId: self.profileTabId,
					blogTabUrl: self.blogTabUrl,
					facebookTabUrl: self.facebookTabUrl,
					facebookTabId: self.facebookTabId,
					twitterTabUrl: self.twitterTabUrl,
					twitterTabId: self.twitterTabId,
					instagramTabUrl: self.instagramTabUrl,
					instagramTabId: self.instagramTabId,
					results: self.getState("results"),
					"results-full": self.getState("results-full"),
					"results-daily": self.getState("results-daily")
				};
			} else if (IconosquareBot.metaParams.indexOf(keyword) != -1) {
				return JSON.parse(localStorage.getItem(keyword)) || IconosquareBot.metaParamsDefauls[keyword];
			} else {
				return JSON.parse(localStorage.getItem(keyword + "-" + IconosquareBot.getState("option")) || null) || IconosquareBot.metaParamsDefauls[keyword];
			}
		},

		processHashtags: function(hashtags) {
			var results = {};
			for (var i = 0; i < hashtags.length; i ++) {
				var hashtag = hashtags[i];
				results[hashtag[1]] = {
					id: JSON.parse(hashtag[0]),
					name: hashtag[1],
					picture_count: JSON.parse(hashtag[2]),
					contact_count: JSON.parse(hashtag[3]),
					search_option: hashtag[4],
					updated_at: hashtag[5]
				};
			}
			IconosquareBot.saveState("hashtags", results);
			return results;
		}
	/*	End of BOT state mgmt methods */
};


/**
 *	User defined functions.
 */

	var sendMessage = function(msg, data, callback) {
			if (typeof callback == "function") {
				chrome.extension.sendMessage({
				        msg: msg,
				        data: data
				    }, 
				    callback
				);
			} else {
				chrome.extension.sendMessage({
			        msg: msg,
			        data: data
			    });
			}	
		};

	var removeParams = function(addr) {
			if (!addr) {
				return addr;
			} else if (addr.indexOf("?") > -1) {
				return addr.substring(0, addr.indexOf("?"));
			} else {
				return addr;
			}
		}

	var removeLastSlash = function(addr) {
			if (!addr)
				return addr;

			addr = removeParams(addr);

			if (addr.substr(addr.length - 1) == "/")
				return addr.substring(0, addr.length - 1);
			else
				return addr;
		}

	var removeProtocol = function(addr) {
			var https = "https://",
				http = "http://";

			if (!addr)
				return addr;

			addr = removeLastSlash(addr);
			
			if (addr.indexOf(https) == 0) {
				return addr.substr(https.length);
			} else if (addr.indexOf(http) == 0) {
				return addr.substr(http.length);
			} else {
				return addr;
			}
		};

	var removeWWW = function(addr) {
			var www = "www.";

			if (!addr) {
				return addr;
			} else if (addr.indexOf(www) == 0) {
				return addr.substr(www.length);
			} else {
				return addr;
			}
		};

	var compareUrl = function(url1, url2) {
			url1 = removeWWW(removeProtocol(url1));
			url2 = removeWWW(removeProtocol(url2));

			return (((url1) ? url1.toUpperCase() : null) == ((url2) ? url2.toUpperCase() : null));
		};

	var unique = function(array) {
			return $.grep(array, function(el, index) {
				return index == $.inArray(el, array);
			});
		};

	var isExistInContacts = function(contact, contacts) {
		for (var i = 0; i < contacts.length; i++ ) {
			if (contact.source_network == contacts[i].source_network) {
				return {status: true, index: i};
			}
		}

		return {status: false};
	};

	var refineIconos = function(iconos) {
		var result = [],
			backup = [];

		$.each(iconos, function(i, value) {
			pos = backup.indexOf(value);
			if (pos == -1) {
				result.push(value);
				backup.push(value);
			} else {
				result[pos].note = (result[pos].note || 0) + 1;
			}
		})
		return result;
	};

	var getCSVContent = function(iconos) {
			var iconos = refineIconos(iconos);
			var result = 'ID, Hashtag,Email, Picture Url, Profile Url, Followers, Medias, ' +
							'Facebook profile, Facebook Count, Twitter profile,Twitter Count,' +
							'Instagram profile,Instagram Count,Posted At\n';
			for (var i = 0; i < iconos.length; i++)
			{
				var icono = iconos[i];
				result += '"' + ((icono.id) ? icono.id : i) + '"' + ',' + 
						  '"' + (icono.hashtag || "") + '"' + ',' +
						  '" ",' +
						  '"' + icono.picture_url + '"' + ',' +
						  '"' + icono.profile + '"' + ',' +
						  '"' + icono.followers + '"' + ',' +
						  '"' + icono.medias + '"' + ',' +
						  '"' + icono.facebook + '"' + ',' +
						  '"' + icono.facebook_follower + '"' + ',' +
						  '"' + icono.twitter + '"' + ',' +
						  '"' + icono.twitter_follower + '"' + ',' +
						  '"' + icono.instagram + '"' + ',' +
						  '"' + icono.instagram_follower + '"' + ',' +
						  '"' + icono.posted_date + '"\n';
			}
			return result;
		};

	var downloadIconos = function(results, obj) {
			blob = new Blob([getCSVContent(results)], { type: 'text/csv' }); //new way
			var csvUrl = URL.createObjectURL(blob);

			if (results.length > 0) {
				obj.removeClass("hide")
					.attr({
							'href': csvUrl
						});
				obj.find("span.badge").text(results.length);
			} else {
				obj.addClass("hide");
			}
		};

	var removeChromeTab = function(id, callback) {
			chrome.tabs.query({currentWindow: true}, function(tabs) {
				$.each(tabs, function(i, tab) {
					if (tab.id == id) {
						if (typeof callback == "function")
							chrome.tabs.remove(id, callback);
						else
							chrome.tabs.remove(id);
					}
				});
			});
		};

	var GetEmailsFromString = function(input) {
			var ret = [],
				email = /\"([^\"]+)\"\s+\<([^\>]+)\>/g

			var match;
			while (match = email.exec(input))
				ret.push({'name':match[1], 'email':match[2]})

			return ret;
		};

	var unique = function(array) {
			return $.grep(array, function(el, index) {
				return index == $.inArray(el, array);
			});
		}

	var truncText = function(text, maxLength, ellipseText){
			ellipseText = ellipseText || '&hellip;';

			if (text.length < maxLength) 
			    return text;

			//Find the last piece of string that contain a series of not A-Za-z0-9_ followed by A-Za-z0-9_ starting from maxLength
			var m = text.substr(0, maxLength).match(/([^A-Za-z0-9_]*)[A-Za-z0-9_]*$/);
			if(!m) return ellipseText;

			//Position of last output character
			var lastCharPosition = maxLength-m[0].length;

			//If it is a space or "[" or "(" or "{" then stop one before. 
			if(/[\s\(\[\{]/.test(text[lastCharPosition])) lastCharPosition--;

			//Make sure we do not just return a letter..
			return (lastCharPosition ? text.substr(0, lastCharPosition+1) : '') + ellipseText;
		}

	var learnRegExp = function(s) {    
		var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
		return regexp.test(s);    
	}
/*	User defined functions	*/