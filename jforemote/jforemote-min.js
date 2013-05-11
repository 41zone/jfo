/**
 * 
 * JFO Remote JS
 * 使用方法：通过匿名函数进行构建
 * @version 0.1 beta
 * @author jiuzhang song
 * @date 2013/04/25
 */
/**
 * @param opts 对象参数
 */
(function(opts) {
	var jfoRemote = function() {
		this.settings = {
			begin : function() {
			},
			success : function() {
			},
			error : function() {
			},
			scripts : [],
			styles : [],
			custom : {}
		};
		this.ajax = {
			url : '',
			method : 'GET',
			type : 'text',
			cache : false,
			async : true,
			params : {},
			success : function(data, xhr) {
			},
			error : function(status, xhr) {
			}
		};
		this.httpRequest = false;
		this.scripts = {
			len : 0,
			list : [],
			loaded : 0
		};
		this.styles = {
			len : 0,
			list : [],
			loaded : 0
		};
		this.oid = "JFO_REMOTE_" + Math.floor(Math.random() * 100000)+"_"+new Date().getTime();
		this.div = null;
		this.params = {};
	};
	var isIE = typeof document.all !== "undefined";
	jfoRemote.prototype = {
		/**
		 * 初始化
		 */
		init : function() {
			this.div = document.getElementById(this.oid);
			if (typeof this.div === 'undefined' || this.div === null) {
				document.write('<div id="' + this.oid + '"></div>');
			}
			this.div = document.getElementById(this.oid);
			this.readParams();
		},
		/**
		 * 读取传递的配置
		 */
		readParams : function() {
			var scripts = document.getElementsByTagName("script");
			script = scripts[scripts.length - 1];
			var src = script.src;
			var reg = /(?:\?|&)(.*?)=(.*?)(?=&|$)/g;
			var temp, ps = {};
			while ((temp = reg.exec(src)) != null) {
				ps[temp[1]] = decodeURIComponent(temp[2]);
			}
			this.params = ps;
		},
		/**
		 * 属性继承，进行深度复制重写，当前对象只支持原子模型对象
		 * 
		 * @param o
		 *            原始属性
		 * @param n
		 *            最新属性
		 */
		overwrite : function(o, n) {
			if (typeof o !== 'object' || typeof n !== 'object') {
				return o;
			}
			for ( var k in n) {
				if (typeof o[k] !== 'undefined' && typeof n[k] === typeof o[k]) {
					if (typeof o[k] === 'object' && !(o[k] instanceof Array)) {
						this.overwrite(o[k], n[k]);
					} else {
						o[k] = n[k];
					}
				} else {
					o[k] = n[k];
				}
			}
			return o;
		},
		/**
		 * 快捷操作，加载过程：样式 -> 脚本加载
		 * 
		 * @param opts
		 *            参数
		 */
		oneStep : function(opts) {
			var _this = this;
			this.init();
			this.overwrite(this.settings, opts);
			this.settings.begin(this);
			this.loadStyle(function() {
				_this.loadScript(function() {
					_this.settings.success(_this);
				}, _this.settings.scripts);
			}, this.settings.styles);
		},
		/**
		 * 是否存在脚本
		 * 
		 * @param script
		 *            脚本
		 * @returns 是否存在脚本
		 */
		existScript : function(script) {
			var list = this.scripts.list;
			for ( var i = 0; i < list.length; i++) {
				if (list[i] == script) {
					return true;
				}
			}
			return false;
		},
		/**
		 * 是否存在样式
		 * 
		 * @param style
		 *            样式
		 * @returns 是否存在样式
		 */
		existStyle : function(style) {
			var list = this.styles.list;
			for ( var i = 0; i < list.length; i++) {
				if (list[i] == style) {
					return true;
				}
			}
			return false;
		},
		/**
		 * 安装加载事件
		 * 
		 * @param obj
		 *            事件源
		 * @param data
		 *            事件所涉猎数据
		 * @param success
		 *            成功加载后的回调函数
		 */
		installLoadEvent : function(obj, data, success) {
			var _this = this;
			if (isIE) {
				obj.attachEvent("onreadystatechange",
						function() {
							if (obj.readyState == 'loaded'
									|| obj.readyState == 'complete') {
								data.loaded++;
								if (data.loaded >= data.len) {
									success(_this);
								}
								obj.detachEvent("onreadystatechange",
										arguments.callee);
							}
						});
			} else {
				obj.addEventListener("load", function() {
					data.loaded++;
					if (data.loaded >= data.len) {
						success(_this);
					}
					obj.removeEventListener("load", arguments.call, false);
				}, false);
			}
		},
		/**
		 * 加载脚本
		 * 
		 * @param success
		 *            所有脚本全部加载成功后回调函数
		 * @param args
		 *            脚本数组
		 */
		loadScript : function(success, args) {
			if (args.length <= 0) {
				success(this);
				return ;
			}
			this.scripts.len = args.length;
			for ( var i = 0; i < args.length; i++) {
				if (this.existScript(args[i])) {
					continue;
				}
				var item = args[i];
				var script = document.createElement("script");
				script.type = "text/javascript";
				if (typeof item === 'string') {
					script.src = item;
				} else if (typeof item === 'object'
						&& typeof item['url'] !== 'undefined') {
					if (typeof item['conflict'] !== 'undefined'
							|| item['conflict'] !== null) {
						if (typeof window[item['conflict']] !== 'undefined') {
							this.scripts.len--;
							throw new Error(
									'The page exist object conflict script about "'
											+ item['conflict'] + '"');
							continue;
						}
					}
					script.src = item.url;
				} else {
					script = null;
					this.scripts.len--;
					continue;
				}
				this.div.appendChild(script);
				this.scripts.list.push(script);
				this.installLoadEvent(script, this.scripts, success);
			}
			if (args.length <= 0) {
				success(this);
			}
		},
		/**
		 * 加载样式
		 * 
		 * @param success
		 *            所有样式全部加载成功后回调函数
		 * @param args
		 *            样式数组
		 */
		loadStyle : function(success, args) {
			if (args.length <= 0) {
				success(this);
				return ;
			}
			this.styles.len = args.length;
			for ( var i = 0; i < args.length; i++) {
				if (this.existStyle(args[i])) {
					continue;
				}
				var style = document.createElement("link");
				style.type = "text/css";
				style.rel = "stylesheet";
				style.href = args[i];
				this.div.appendChild(style);
				this.styles.list.push(style);
				this.installLoadEvent(style, this.styles, success);
			}
		},
		_httpRequest : function() {
			var request = false;
			if (window.XMLHttpRequest) {
				request = new XMLHttpRequest();
			} else {
				try {
					request = new ActiveXObject('Msxml2.XMLHTTP');
				} catch (e) {
					try {
						request = new ActiveXObject('Microsoft.XMLHTTP');
					} catch (e) {
						request = false;
					}
				}
			}
			return request;
		},
		serialize : function(json) {
			var strArr = [];
			for ( var i in json) {
				if (!((typeof json[i]).toLowerCase() == "function" || (typeof json[i])
						.toLowerCase() == "object")) {
					strArr.push(encodeURIComponent(i) + "="
							+ encodeURIComponent(json[i]));
				}
			}
			return strArr.join("&");
		},
		_back : function() {
			var op = this.ajax;
			switch (op.type) {
			case "json":
				var json = null;
				eval("json = " + this.httpRequest.responseText);
				return json;
			case "xml":
				return this.httpRequest.responseXML;
			default:
				return this.httpRequest.responseText;
				break;
			}
		},
		_data : function(type, data) {
			switch (type) {
			case 'json':
			case 'crossjson':
				var json = null;
				eval("json = " + data);
				return json;
			default:
				return data;
				break;
			}
		},
		request : function(opts) {
			this.overwrite(this.ajax, opts);
			var ajax = this.ajax;
			var _this = this;
			this.ajax.type = this.ajax.type.toLowerCase();
			var method = (ajax.method == null || typeof ajax.method === 'undefined') ? ''
					: ajax.method.toUpperCase();
			method = ajax.type === 'jsonp' || ajax.type === 'crossjson'
					|| ajax.type === 'crosstext' ? 'GET' : method;
			if (!(method === 'POST' || method === 'GET')) {
				throw new Error('error for method can\'t supply.');
				return;
			}
			var params = '';
			if (typeof ajax.params === 'string')
				params = ajax.params;
			else if (typeof ajax.params === 'object'
					&& !(ajax.params instanceof Array))
				params = this.serialize(ajax.params);
			var url = ajax.url
					+ (ajax.url.indexOf("?") == -1 ? "?" : "")
					+ (method === "POST" ? '' : params
							+ (!ajax.cache ? '&_='
									+ Math.floor(Math.random() * 100000) : ''));
			if (this.ajax.type === 'jsonp') {
				this.jsonp(url, ajax.success);
				return;
			} else if (this.ajax.type === 'crossjson'
					|| this.ajax.type === 'crosstext') {
				this.iframe(url, ajax.success, ajax.type);
				return;
			}
			if (!this.httpRequest)
				this.httpRequest = this._httpRequest();
			var req = this.httpRequest;
			if (this.ajax.async) {
				req.onreadystatechange = function() {
					if (req.readyState == 4) {
						if (req.status == 200) {
							ajax.success(_this._back(), req);
						} else {
							ajax.error(req.status, req);
						}
					}
				};
			}

			try {
				req.open(method, url, ajax.async);
			} catch (e) {
				ajax.error(req.status);
				return;
			}
			if (!ajax.cache) {
				req.setRequestHeader("If-Modified-Since", "0");
				req.setRequestHeader("Cache-Control", "no-cache");
				req.setRequestHeader("Pragma", "no-cache");
			}

			if ("POST" === method) {
				req.setRequestHeader("Content-Type",
						"application/x-www-form-urlencoded");
				req.send(params);
			} else {
				req.send();
			}
			if (!ajax.async) {
				ajax.success(this._back());
			}
		},
		/**
		 * 通过jsonp构建
		 * */
		jsonp : function(url, success) {
			var script = document.createElement("script");
			script.type = 'text/javascript';
			var dynFn = false;
			if(url.indexOf('callback',url.indexOf('?')) == -1) {
				var methodName = "jfoRemote_"+Math.floor(Math.random()*1000000);
				window[methodName] = success;
				dynFn = true;
				url += '&callback='+methodName;
			}
			script.src = url;
			var head = document.getElementsByTagName('head')[0];
			head.appendChild(script);
			if (script.attachEvent) {
				script.attachEvent('onreadystatechange', function() {
					if (this.readyState == 'loaded'
							|| this.readyState === 'complete') {
						script.detachEvent('onreadystatechange',
								arguments.callee);
						head.removeChild(script);
						if(!dynFn) {success(null, null);};
					}
				});
			} else {
				script.addEventListener('load', function() {
					this.removeEventListener('load', arguments.callee, false);
					head.removeChild(script);
					if(!dynFn) {success(null, null);};
				}, false);
			}
		},
		iframe : function(url, success, type) {
			var _this = this;
			var ifr_name = 'ifr_' + Math.floor(Math.random() * 100000);
			var ifr = '<iframe name="' + ifr_name
					+ '" style="display:none;" src="' + url + '" id="'
					+ ifr_name + '"></iframe>';
			var body = document.getElementsByTagName('body')[0];
			body.innerHTML += ifr;
			ifr = document.getElementById(ifr_name);
			if (ifr.attachEvent) {
				ifr.attachEvent(
								'onreadystatechange',
								function() {
									if (ifr.readyState === 'loaded'
											|| ifr.readyState === 'complete') {
										var data = document.frames[ifr_name].document.body.innerHTML;
										success(_this._data(type, data), null);
										ifr.detachEvent('onreadystatechange',
												arguments.callee);
										body.removeChild(ifr);
									}
								});
			} else {
				ifr.addEventListener('load', function() {
					var name = window.frames[ifr_name].window.name;
					alert(name);
					var data = window.frames[ifr_name].document.body.innerHTML;
					success(_this._data(type, data), null);
					this.removeEventListener('load', arguments.callee, false);
					body.removeChild(ifr);
				}, false);
			}
		}
	};
	var n = new jfoRemote();
	n.oneStep(opts);
})
({
	begin:function(remote){
	},
	success:function(remote){
		$('body').css('backgroundColor','black').css('color','white');
		$('body').append('hi, I\'m '+remote.params.name+", everyone take me to somewhere for building tower high and strong.");
	},
	scripts:['http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js'],
	styles:[]
});