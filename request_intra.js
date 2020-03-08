var sleep = require('./sleep').sleep;
var rq = require('sync-request');

class intraRq {

	constructor(){
		this.connexion();
	}

	connexion() {
		var request = rq("POST", "https://api.intra.42.fr/oauth/token", {
			json:{
				"grant_type":"client_credentials",
				"client_id":"a240d44cba74426f9ee83c9c3271e985740075e01ceee55e007550a46badaa3d",
				"client_secret":"0644c6df34f448a0b0c50a539716b81b7fd491afcf6314579b6d99101bddfe46"
			}
		});
		var body = JSON.parse(request.getBody('utf8'));
		this.token = body.access_token;
	}

	async request_intra(path) {
		try{
			var request = rq("GET", path, {
				headers:{
					'Authorization': "Bearer " + this.token
				}
			});
		}catch(e){
			return(new Promise((resolve, reject) => (reject(e))));
		}
		if (request.statusCode == 429){
			console.log(request.headers['retry-after'] / 60 + "Min");
			await sleep(request.headers['retry-after'] * 1000);
			return (this.request_intra(path, this.token));
		}
		if (request.statusCode == 401){
			this.connexion();
			return(this.request_intra(path, this.token));
		}
		return(new Promise(resolve => (resolve(JSON.parse(request.getBody())))));
	}
}

exports.intraControler = intraRq;