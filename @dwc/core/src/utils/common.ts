
/**
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing.
 * @param {*} this
 * @param {Function} func
 * @param {number} wait
 * @param {Boolean} immediate
 * @returns {Function}
 */
export function debounce(func:Function, wait:number=250) {
	let timeout;
	return (...args:any[]) =>{
		clearTimeout(timeout);
		timeout = setTimeout(function() {
			timeout = null;
			func(args);
		}, wait);
	};
}