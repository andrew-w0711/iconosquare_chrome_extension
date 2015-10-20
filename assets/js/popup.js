(function(window, jQuery){
	var Popup = {
		status: "stop",
		hashtag: "",
		searchOption: "full",
		"results-full": [],
		"results-daily": [],

		switchTo: function(option){
			if (option == "full") {
				this.switchToFull();
			} else if (option == "daily") {
				this.switchToDaily();
			}
			$(".input-group #option").val(option);
		},
		switchToFull: function() {
			var results = Popup["results-full"];
			this.searchOption = "full";
			downloadIconos(results, $("#download"));
			$(".fieldset.hashtag-option").show();
		},
		switchToDaily: function() {
			var results = Popup["results-daily"];
			this.searchOption = "daily";
			downloadIconos(results, $("#download"));
			$(".fieldset.hashtag-option").hide();
		},
		start: function() {
			var hashtag = Popup.hashtag,
				option = Popup.searchOption;

			if (option == "full" && hashtag.length == 0) {
				alert("Please type a hashtag.");
				return false;
			}
			
			chrome.extension.sendMessage({msg: "start", hashtag: hashtag, option: option}, function(response) {
				console.log("Response from background script: " + response.data);
				if (response.data === "started") {
					Popup.setStatus("started");
				} else if (response.data == "exist") {
					console.log(response.msg);
					alert(response.msg);
					Popup.stop();
				} else if (response.data == "done") {
					console.log(response.msg);
					alert(response.msg);
					Popup.stop();
				}
			});
		},
		stop: function() {
			chrome.extension.sendMessage({msg: "stop"}, function(response) {
				console.log("Response from background script: " + response.data);
				if (response.data === "stopped") {
					Popup.setStatus("stopped");
				}
			});
		},

		restart: function() {

			var hashtag = Popup.hashtag,
				option = Popup.searchOption;

			if (option == "full" && hashtag.length == 0) {
				alert("Please type a hashtag.");
				return false;
			}

			chrome.extension.sendMessage({msg: "restart", hashtag: hashtag, option: option}, function(response) {
				console.log("Response from background script: " + response.data);
				if (response.data === "started") {
					Popup.setStatus("started");
				} else if (response.data == "exist") {
					console.log(response.msg);
					alert(response.msg);
					Popup.stop();
				} else if (response.data == "done") {
					console.log(response.msg);
					alert(response.msg);
					Popup.stop();
				}
			});
		},

		setHashtag: function(hashtag) {
			Popup.hashtag = hashtag;
		},

		showHashtag: function(hashtag) {
			$("#hashtag").val(hashtag);
		},

		setStatus: function(status) {
			if (status == "started") {
				$(".fieldset #start").hide();
				$(".fieldset #restart").hide();
				$(".fieldset #stop").show();
			} else if (status == "stopped") {
				$(".fieldset #start").show();
				$(".fieldset #restart").show();
				$(".fieldset #stop").hide();
			}
		},

		initEvents: function() {
			$(".input-group select#option").change(function() {
				Popup.switchTo($(this).val());
			});

			$("#hashtag").change(function() {
				Popup.setHashtag($(this).val());
			});

			$(".fieldset #start").click(this.start);
			$(".fieldset #restart").click(this.restart);
			$(".fieldset #stop").click(this.stop);
			return Popup;
		},

		initialize: function(params) {
			if (params) {
				if (params.status !== undefined) {
					Popup.setStatus(params.status);
				}

				if (params.option !== undefined) {
					Popup.switchTo(params.option);
				}

				if (params['static-hashtag'] !== undefined && params['static-hashtag'] !== "") {
					Popup.showHashtag(params['static-hashtag']);
					Popup.setHashtag(params['static-hashtag']);
				} else {
					var tmp = params["hashtags"];
					$.each(tmp, function(key, value) {
						Popup.showHashtag(value.name);
						Popup.setHashtag(value.name);
						return false;
					});
				}

				Popup["results-full"] = params["results-full"];
				Popup["results-daily"] = params["results-daily"];

				downloadIconos(Popup["results-" + Popup.searchOption], $("#download"));
			}
			return this;
		}
	}
	$(document).ready(function(){
		chrome.extension.sendMessage({msg: "state"}, function(response) {
			Popup.initialize(response).initEvents();
		});
	});


})(window, $);