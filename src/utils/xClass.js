function isPlainObject(obj){
	return typeof obj === 'object' && obj.constructor === Object;
}

function uniq(strArray, removeFalsey=false){
	var uniqs = {};
	if (removeFalsey){
		for (var i = 0; i < strArray.length; i++){
			if (strArray[i]){
				uniqs[strArray[i]] = true;
			}
		}
	}
	else{
		for (var i = 0; i < strArray.length; i++){
			uniqs[strArray[i]] = true;
		}
	}
	return Object.keys(uniqs);
}

export default function xClass(...args){

	let classes = args.reduce((prev, curr) => {
		if (isPlainObject(curr)){
			// combine class/predicate pairs into an array
			let cs = [];
			for (let key in curr){
				if (typeof curr[key] === 'function'){
					if (curr[key]()){
						cs.push(key);
					}
				}
				else if (typeof curr[key] === 'boolean'){
					if (curr[key]){
						cs.push(key);
					}
				}
				else if (isPlainObject(curr[key])){
					cs.push(xClass(curr[key]));
				}
			}
			return prev.concat(cs);
		}
		else if (curr instanceof Array){
			// recursively iterate over array elements
			return prev.concat(
				curr.reduce(
					(l, c) => l.concat(xClass(c)), []
				)
			);
		}
		else if (typeof curr === 'string'){
			return prev.concat(curr);
		}
		else if (typeof curr === 'function'){
			// recursively apply function's return
			return prev.concat(xClass(curr()));
		}
		else {
			return prev;
		}
	}, []);

	return uniq(classes, true).join(' ');
}

module.exports = xClass;