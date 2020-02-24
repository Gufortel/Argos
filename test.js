var intra = require('./request_intra').intraControler;

async function test() {
	var rq = new intra();
	var i = 0;
	var number = 0;
	while(1){
		var json = await rq.request_intra("https://api.intra.42.fr/v2/users/25688/locations" + "?page[size]=100&page[number]=" + i);
		number = json.length + number;
		console.log(number);
		console.log(json[json.length - 1].end_at);
		i++;
	}
}

test();