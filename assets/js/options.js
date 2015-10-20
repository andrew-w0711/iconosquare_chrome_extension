var Option = {
	Hashtags: [],
	Iconosquares: {}
};

var displayAlert = function(option, text) {
		$('#status').html('<p class="alert alert-' + option + '">' + text + '</p>');
			setTimeout(function () {
				$('#status').html('');
			}, 3500);
	};

var initTab = function () {
		$("ul.nav-tabs li.tab").click(function() {
			$("ul.nav-tabs li").removeClass("active");
			$(this).addClass("active");
			$("#database div.table").addClass("hidden");
			$("#database div.table#" + $(this).attr("table")).removeClass("hidden");

			if ($(this).attr('table') == 'leads') {
				$("ul.nav ul.dropdown-menu li#remove a").addClass('disabled');
			} else {
				$("ul.nav ul.dropdown-menu li#remove a").removeClass('disabled');
			}
		});

		$(".disabled").click(function(event) {
			event.preventDefault();
			return;
		});

		$("ul.dropdown-menu li#refresh a").click(function() {
			if ( $("ul.nav-tabs li.tab.active").attr("table") == "leads" ) {
				displayHashtags(function() {
					displayAlert('success', 'Leads table is refreshed successfully.');
				});
			} else {
				displayIconos(function() {
					displayAlert('success', 'Contacts table is refreshed successfully.');
				});
			}
		});

		$("ul.dropdown-menu li#remove a").click(function() {
			if ( $("ul.nav-tabs li.tab.active").attr("table") == "leads" ) {
				console.log("You are not able to remove content from lead table.");
				displayAlert("danger", "You are not able to remove content from lead table.");
			} else {
				if (confirm("Are you sure to delete all contacts from database?")) {
					IconoAPI.deleteAllContacts(function(res) {
						if (res) {
							displayAlert("success", "Contacts are deleted from database");
							displayIconos();
						}
					})
				}
			}
		});

		if ( $("ul.nav-tabs li.active").length == 0 ) {
			$nav = $($("ul.nav-tabs li")[0]);
			$nav.addClass("active")
			$("#database div.table").addClass("hidden");
			$("#database div.table#" + $nav.attr("table")).removeClass("hidden");
		};

		displayHashtags();
		displayIconos();
	};

var displayHashtags = function(callback) {
		$hashtagsContainer = $("div#hashtags table tbody");
		$hashtagsContainer.find("tr").remove();

		hashtags = [];

		IconoAPI.getHashtags(null, function(hashtags) {
			for (var i = 0; i < hashtags.length; i++ ) {
				var hashtag = hashtags[i],
					tmp = {
						id: hashtag[0],
						name: hashtag[1],
						search_option: hashtag[4],
						searched_at: hashtag[5]
					};

				$hashtagsContainer.append($('<tr/>', {id: hashtag[1]}).append(
						$('<td/>').text(tmp.id),
						$('<td/>').text(tmp.name),
						$('<td/>').text(tmp.search_option),
						$('<td/>').text(tmp.searched_at),
						$('<td/>').append(
							$('<a/>', {class: "btn btn-primary hide"})
								.text("Download")
								.attr({
									download: tmp.name + ".csv"
								}).append(
									$("<span/>", {class: "badge"})
								)
						)
					));

				Option.Hashtags.push(tmp);
			}

			if (typeof callback == "function") {
				callback();
			}
		})
	};

var displayIconos = function(callback) {
		$iconosContainer = $("div#iconos table tbody");
		$iconosContainer.find("tr").remove();
		var results = [];

		IconoAPI.getIconos(null, function(iconos) {
			for (var i = 0; i < iconos.length; i++ ) {
				var cur = iconos[i],
					tmp = {
						id: cur[0],
						hashtag: cur[1],
						picture_url: cur[2],
						profile: cur[3],
						followers: cur[4],
						medias: cur[5],
						facebook: (learnRegExp(cur[8])) ? cur[8] : "",
						facebook_follower: (learnRegExp(cur[8])) ? cur[9] : "",
						twitter: (learnRegExp(cur[10])) ? cur[10] : "",
						twitter_follower: (learnRegExp(cur[10])) ? cur[11] : "",
						instagram: (learnRegExp(cur[12])) ? cur[12] : "",
						instagram_follower: (learnRegExp(cur[12])) ? cur[13] : "",
						posted_date: cur[14].substr(0, 10)
					};

				if (Option.Iconosquares[tmp.hashtag] == undefined) {
					Option.Iconosquares[tmp.hashtag] = [];
				}
				Option.Iconosquares[tmp.hashtag].push(tmp);

				$iconosContainer.append($('<tr/>').append(
						$('<td/>').text(tmp.id),	//	ID
						$('<td/>').text(tmp.hashtag),	//	Hashtag
						$('<td/>').append(
								$('<a/>', 
									{href: tmp.picture_url, title: tmp.picture_url, target: "_blank"}
								).text(truncText(tmp.picture_url, 25, "..."))),	//	picture
						$('<td/>').text(tmp.profile),	//	profile
						$('<td/>').text(tmp.followers),	//	followers
						$('<td/>').text(tmp.medias),	//	medias
						$('<td/>').append($('<a/>', {
														href: tmp.facebook,
														title: tmp.facebook,
														target: "_blank"
													}
									).text(truncText(tmp.facebook, 25, "..."))),	//	facebook
						$('<td/>').text(tmp.facebook_follower),	//	facebook followers
						$('<td/>').append($('<a/>', {
														href: tmp.twitter,
														title: tmp.twitter,
														target: "_blank"
													}
											).text(truncText(tmp.twitter, 30, "..."))),	//	twitter
						$('<td/>').text(tmp.twitter_follower),	//	twitter followers
						$('<td/>').append($('<a/>', {
														href: tmp.instagram,
														title: tmp.instagram,
														target: "_blank"
													}
												).text(truncText(tmp.instagram, 30, "..."))),	//	instagram
						$('<td/>').text(tmp.instagram_follower),	//	instagram followers
						$('<td/>').text(tmp.posted_date)/*,	//	posted date
						$('<td/>').text("")	//	Preserved for action*/
					));
				
				results.push(tmp);
			
			}

			$.each(Option.Hashtags, function(key, value) {
				var hashtag = value.name,
					$downloadLink = $("#" + hashtag + " a"),
					$badge = $("#" + hashtag + " a span.badge"),
					tempIconos = Option.Iconosquares[hashtag];

				if (tempIconos && tempIconos.length > 0) {
					blob = new Blob([getCSVContent(tempIconos)], {type: 'text/css'});

					$downloadLink.attr({
						href: URL.createObjectURL(blob)
					}).removeClass("hide");
					$badge.text(tempIconos.length);
				}
			});
			if (typeof callback == "function")
				callback();
		})
	};

var initializeOptionPage = function() {
		initTab();
	};

$(document).ready(function () {
    initializeOptionPage();
});