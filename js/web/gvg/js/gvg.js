/*
 * **************************************************************************************
 * Copyright (C) 2021  FoE-Helper team - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the AGPL license.
 *
 * See file LICENSE.md or go to
 * https://github.com/dsiekiera/foe-helfer-extension/blob/master/LICENSE.md
 * for full license details.
 *
 * **************************************************************************************
 */

FoEproxy.addHandler('ClanBattleService', 'grantIndependence', (data, postData) => {
	GvG.AddCount(data.responseData.__class__, postData[0]['requestMethod']);
});

FoEproxy.addHandler('ClanBattleService', 'deploySiegeArmy', (data, postData) => {
	GvG.AddCount(data.responseData.__class__, postData[0]['requestMethod']);
});

FoEproxy.addHandler('ClanBattleService', 'deployDefendingArmy', (data, postData) => {
	GvG.AddCount(data.responseData.__class__, postData[0]['requestMethod']);
});

FoEproxy.addHandler('ClanBattleService', 'getContinent', (data, postData) => {
	if (GvG.Actions == undefined) {
		GvG.initActions();
	}
	GvG.setRecalc(data.responseData.continent.calculation_time.start_time, true);
});

FoEproxy.addHandler('ClanBattleService', 'getProvinceDetailed', (data, postData) => {	
	GvGProvince.MapData = data['responseData'];
	GvGProvince.MapDataTime = MainParser.getCurrentDateTime();
});

FoEproxy.addHandler('AnnouncementsService', 'fetchAllAnnouncements', (data, postData) => {
	GvG.HideGvgHud();
});

let GvG = {
	Actions: undefined,
	Init: false,

	initActions: () => {
		console.log("GvG Init");
		let Actions = JSON.parse(localStorage.getItem('GvGActions'));

		if (Actions == null) {			
			Actions = {
				Independences: 0,
				Sieges: 0,
				Defenders: 0,
				NextCalc: 0,
				PrevCalc: 0,
				LastAction: 0
			};
			localStorage.setItem('GvGActions', JSON.stringify(Actions));
		}
		GvG.Actions = Actions;
		GvG.Init = true;
	},

    /**
	 * Build HUD
	 */
	showGvgHud: () => {
		if ($('#gvg-hud').length == 0) {
			HTML.AddCssFile('gvg');
			let div = $('<div />');

			div.attr({
				id: 'gvg-hud',
				class: 'game-cursor'
			});

			$('body').append(div).promise().done(function() {
				div.append('<div class="independences">'+GvG.Actions.Independences+'/4</div><div class="sieges">'+GvG.Actions.Sieges+'</div><div class="defenders">'+GvG.Actions.Defenders+'</div>')
					.attr('title', i18n('GvG.Independences.Tooltip') + '<br><em>' + i18n('GvG.Independences.Tooltip.Warning') + '</em>')
					.tooltip(
						{
							useFoEHelperSkin: true,
							headLine: i18n('Global.BoxTitle'),
							placement: 'bottom',
							html: true
						}
					)
					.append('<button class="btn-default mapbutton" onclick="GvGProvince.showGvgMap()">MAP</button>');
			});
		}
		else {
			$('#gvg-hud .independences').text(GvG.Actions.Independences+'/4');
			$('#gvg-hud .sieges').text(GvG.Actions.Sieges);
			$('#gvg-hud .defenders').text(GvG.Actions.Defenders);
		}
	},

    /**
	 * Hide HUD
	 */
	HideGvgHud: () => {
		if ($('#gvg-hud').length > 0) {
			$('#gvg-hud').fadeToggle(function() {
				$(this).remove();
			});
		}
	},

	/**
	 * 
	 * @param {*} response  
	 * @param {*} requestMethod 
	 */
	AddCount: (response, requestMethod) => {
		let time = Math.ceil(MainParser.getCurrentDateTime()/1000); 

		if (time > GvG.Actions.NextCalc) { // when on a map during recalc
			console.log('time > GvG.Actions.NextCalc');
			GvG.resetData();
		}

		if (requestMethod === "deployDefendingArmy" && response === "Success") {
			GvG.Actions.Defenders++;
		}
		else if (requestMethod === "deploySiegeArmy" && response === "Success") {
			GvG.Actions.Sieges++;
		}
		else if (requestMethod === "grantIndependence" && response === "Success") {
			GvG.Actions.Independences++;
		}

		GvG.LastAction = time;
		GvG.showGvgHud();
		
		localStorage.setItem('GvGActions', JSON.stringify(GvG.Actions));
	},
 
    /**
	 * Set Recalc time
	 * @param calcTime
	 */
	 setRecalc: (calcTime) => {
		let time = Math.ceil(MainParser.getCurrentDateTime()/1000); 

		if (GvG.Actions.NextCalc != calcTime) {
			GvG.Actions.NextCalc = calcTime;
			/*if ((time-20) < calcTime) { // when switching maps via overview during recalc
				console.log('Reset during Recalc');
				GvG.resetData(calcTime);
			}*/
		}

		if (GvG.Actions.PrevCalc == 0) {
			GvG.Actions.PrevCalc = (calcTime-86400);
		}

		if (GvG.Actions.LastAction < GvG.Actions.PrevCalc && GvG.Actions.LastAction != 0) {
			console.log('GvG.Actions.LastAction < GvG.Actions.PrevCalc');
			GvG.resetData(calcTime);
		}

		localStorage.setItem('GvGActions', JSON.stringify(GvG.Actions));
		console.log("setRecalc", GvG.Actions);
		GvG.showGvgHud();
	},

    /**
	 * Reset all Data
	 */
	resetData: (calcTime = 0) => {
		let time = Math.ceil(MainParser.getCurrentDateTime()/1000); 
		console.log('GvG Data Reset');

		GvG.Actions.Independences = 0;
		GvG.Actions.Sieges = 0;
		GvG.Actions.Defenders = 0;
		GvG.Actions.PrevCalc = GvG.Actions.NextCalc;
		GvG.Actions.NextCalc = time+40000;
		GvG.Actions.LastAction = time;
		if (calcTime > 0) {
			GvG.Actions.NextCalc = calcTime;
		}
		
		localStorage.setItem('GvGActions', JSON.stringify(GvG.Actions));
	}
}

let GvGProvince = {
	
	Map: {},
	MapData: {},
	MapDataTime: 0,
	MapCTX: {},

	Actions: {
		edit: false,
		drag: true
	},

	Width: 0,
	Height: 0,
	HexWidth: 50,
	HexHeight: 40,
	CurrentGuild: {
		id: 0
	},

	Sectors: [],
	Guilds: [],
	PowerValues: [],
	ProvinceData: {},
	GuildData: {},

	Colors: {
        "blank": [{"r":240,"g":240,"b":240}],
        "b": [
            {"r":0,"g":185,"b":238},
            {"r":0,"g":159,"b":227},
            {"r":72,"g":140,"b":203},
            {"r":0,"g":105,"b":180},
            {"r":61,"g":61,"b":210},
            {"r":86,"g":68,"b":163},
            {"r":0,"g":72,"b":153},
            {"r":0,"g":85,"b":120},
            {"r":0,"g":55,"b":97},
            {"r":40,"g":85,"b":120},
            {"r":40,"g":55,"b":97},
            {"r":40,"g":10,"b":50},
            {"r":0,"g":10,"b":50}
        ],
        "r": [
            {"r":203,"g":78,"b":72},
            {"r":163,"g":77,"b":68},
            {"r":227,"g":80,"b":0},
            {"r":238,"g":0,"b":0},
            {"r":180,"g":0,"b":0},
            {"r":153,"g":0,"b":51},
            {"r":120,"g":20,"b":0},
            {"r":140,"g":40,"b":0},
            {"r":97,"g":0,"b":45},
            {"r":127,"g":0,"b":55},
            {"r":140,"g":17,"b":74},
            {"r":190,"g":17,"b":74},
            {"r":210,"g":61,"b":89}
        ],
        "g": [
            {"r":0,"g":220,"b":0},
            {"r":50,"g":200,"b":70},
            {"r":0,"g":180,"b":0},
            {"r":50,"g":160,"b":70},
            {"r":0,"g":140,"b":70},
            {"r":50,"g":120,"b":0},
            {"r":0,"g":100,"b":0},
            {"r":50,"g":80,"b":0},
            {"r":0,"g":60,"b":0},
            {"r":0,"g":40,"b":0},
            {"r":90,"g":160,"b":80},
            {"r":50,"g":180,"b":30},
            {"r":50,"g":200,"b":80}
        ],
        "premium": [
            {"r":2,"g":2,"b":2},
            {"r":36,"g":76,"b":32},
            {"r":13,"g":43,"b":70},
            {"r":14,"g":77,"b":86},
            {"r":79,"g":26,"b":126},
            {"r":100,"g":63,"b":33},
            {"r":232,"g":189,"b":64},
            {"r":35,"g":60,"b":30},
            {"r":93,"g":100,"b":104},
            {"r":80,"g":70,"b":97},
            {"r":61,"g":13,"b":13},
            {"r":56,"g":81,"b":16},
            {"r":210,"g":150,"b":21}]
    },

	Era: "",
	CurrentGuild: {"color": {"r":240,"g":240,"b":240}},
    NoGuild: {"color": {"r":240,"g":240,"b":240}},

	/**
	 * Build GvG Map
	 */
	showGvgMap: () => {
		if ($('#gvg-map').length == 0) {

			moment.locale(MainParser.Language);

			HTML.Box({
				id: 'GvGMap',
				title: 'GvG (BETA!)',
				auto_close: true,
				dragdrop: true,
				minimize: true,
				resize: true
			});

			GvGProvince.buildMap();
		}
	},

    /**
	 * Hide HUD
	 */
	hideGvgMap: () => {
		if ($('#GvGMap').length > 0) {
			$('#GvGMap').remove();
			$('#gvg-map').remove();
		}
	},

	buildMap: () => {

		let h = [];
        h.push('<div id="GvGMapInfo"></div><div id="GvGMapActions" class="btn-group"><span id="editMap" class="btn-default">Edit</span><span id="dragMap" class="btn-default active">Drag</span></div><div id="GvGMapWrap"><canvas id="gvg-map"></canvas></div><div id="GvGMapGuilds"></div>');
		$('#GvGMapBody').html(h.join(''));

		GvGProvince.Map = document.getElementById("gvg-map");
		GvGProvince.MapCTX = GvGProvince.Map.getContext('2d');
		GvGProvince.Guilds = [];
		GvGProvince.Sectors = [];
		GvGProvince.ProvinceData = GvGProvince.MapData.province_detailed;
		GvGProvince.GuildData = GvGProvince.MapData.province_detailed.clans;
		GvGProvince.PowerValues = GvGProvince.MapData.province_detailed.power_values;
		GvGProvince.Width = (GvGProvince.ProvinceData.bounds.x_max - GvGProvince.ProvinceData.bounds.x_min)*GvGProvince.HexWidth+GvGProvince.HexWidth/2;
		GvGProvince.Height = (GvGProvince.ProvinceData.bounds.y_max - GvGProvince.ProvinceData.bounds.y_min)*GvGProvince.HexHeight*0.8;

		$(GvGProvince.Map).attr({
			'id': 'gvg-map',
            'width': GvGProvince.Width,
            'height': GvGProvince.Height
        });
		
		GvGProvince.MapCTX.clearRect(0, 0, GvGProvince.Width, GvGProvince.Height);

        GvGProvince.GuildData.forEach(function (guild) {
			let guildOnMap = {
				id: guild.id,
				name: guild.name,
				flag: guild.flag,
				color: GvGProvince.getColor(guild),
				flagCoordinates: GvGProvince.getFlagImageCoordinates(guild.flag),
				power: 0,
				sectors: 0,
			};
			GvGProvince.Guilds.push(guildOnMap);
        });

        GvGProvince.ProvinceData.sectors.forEach(function (sector) {
            if (/*(sector.terrain == 'plain' || sector.terrain == 'beach') /*&&*/ sector.hitpoints != undefined) {
                let realX = (sector.position.x - GvGProvince.ProvinceData.bounds.x_min) * GvGProvince.HexWidth;
                let realY = (sector.position.y - GvGProvince.ProvinceData.bounds.y_min) * GvGProvince.HexHeight;
				let newSector = {};

				if (sector.position.y % 2 == 0) {
					newSector = new Sector(realX, realY * 0.75, sector);
				}
				else {
					newSector = new Sector(realX + (GvGProvince.HexWidth * 0.5), realY * 0.75, sector);
				}
				GvGProvince.Sectors.push(newSector);
				
				let guild = newSector.findOwnerById(newSector.owner.id);
				if (guild != undefined) {
					guild.power += newSector.power;
					guild.sectors++;
				}
				newSector.draw();
			}
        });

		GvGProvince.drawInfo();
		GvGProvince.buildGuilds();

		let editBtn = document.getElementById("editMap");
		let dragBtn = document.getElementById("dragMap");

        editBtn.addEventListener('click', function (e) {
            GvGProvince.Actions.edit = true;
			GvGProvince.Actions.drag = false;
			dragBtn.classList.remove('btn-default-active');
			editBtn.classList.add('btn-default-active');
        }, false);
        dragBtn.addEventListener('click', function (e) {
            GvGProvince.Actions.edit = false;
			GvGProvince.Actions.drag = true;
			editBtn.classList.remove('btn-default-active');
			dragBtn.classList.add('btn-default-active');
        }, false);

		GvGProvince.mapDragOrEdit();
		GvGProvince.setCurrentGuild();
	},

	drawInfo: () => {
		GvGProvince.MapCTX.font = "bold 22px Arial";
		GvGProvince.MapCTX.textAlign = "left";
		GvGProvince.MapCTX.fillStyle = '#ffb539';
		GvGProvince.MapCTX.fillText(GvGProvince.ProvinceData.era, 10, 25);
		GvGProvince.MapCTX.font = "12px Arial";
		GvGProvince.MapCTX.fillStyle = '#ccc';
		GvGProvince.MapCTX.fillText('Data fetched: '+ moment(GvGProvince.MapDataTime).format('D.M.YY - HH:mm:ss'), 10, 45);
	},

	setCurrentGuild: () => {
        $('#GvGGuilds tr').click(function (e) {
			let id = $(this).attr('id').replace('id-', '')/1;
			$('#GvGGuilds tr').removeClass('active');
			$(this).addClass('active');
			
			GvGProvince.CurrentGuild = GvGProvince.Guilds.find(x => x.id  === id);
			console.log(GvGProvince.CurrentGuild);
        });
	},

	mapDragOrEdit: () => {
		const wrapper = document.getElementById('GvGMapWrap');	
		let pos = { top: 0, left: 0, x: 0, y: 0 };
		
		const mouseDownHandler = function(e) {	
			pos = {
				left: wrapper.scrollLeft,
				top: wrapper.scrollTop,
				x: e.clientX,
				y: e.clientY,
			};
	
			document.addEventListener('mousemove', mouseMoveHandler);
			document.addEventListener('mouseup', mouseUpHandler);
		};
	
		const mouseMoveHandler = function(e) {
			const dx = e.clientX - pos.x;
			const dy = e.clientY - pos.y;
			wrapper.scrollTop = pos.top - dy;
			wrapper.scrollLeft = pos.left - dx;
		};
	
		const mouseUpHandler = function() {	
			document.removeEventListener('mousemove', mouseMoveHandler);
			document.removeEventListener('mouseup', mouseUpHandler);
		};

        GvGProvince.Map.addEventListener('mousedown', function (e) {
			if (GvGProvince.Actions.drag) {
				wrapper.addEventListener('mousedown', mouseDownHandler);
			}
			if (GvGProvince.Actions.edit) {
				wrapper.removeEventListener('mousedown', mouseDownHandler);
			}
			GvGProvince.setSector(e);
        }, false);
	},

	setSector: (e) => {
        GvGProvince.Sectors.forEach(function (sector) {
            if (e.offsetX >= (sector.position.x + 5) && e.offsetX <= (sector.position.x + GvGProvince.HexWidth - 5)) {
                if (e.offsetY >= (sector.position.y + 5) && e.offsetY <= (sector.position.y + GvGProvince.HexHeight - 5)) {
					if (GvGProvince.Actions.drag) {
						GvGProvince.showSector(sector);
						console.log('hi');
					}
					else {
						let prevOwner = sector.owner;
						sector.owner = GvGProvince.CurrentGuild;
						if (sector.owner.id == 0)
							sector.owner.color = sector.setColorByTerrain();
						if (sector.terrain == "plain" || sector.terrain == "beach") {
							sector.draw();
						}
						GvGProvince.recalcGuildProvinces(prevOwner, sector.owner, sector);
					}
                    return sector;
                }
            }
        });
		return undefined;
    },

	recalcGuildProvinces: (oldGuild, newGuild, sector) => {
		if (oldGuild.id > 0) {
			oldGuild.sectors--;
			oldGuild.power -= sector.power;
		}

		if (newGuild.id > 0) {
			newGuild.sectors++;
			newGuild.power += sector.power;
		}

		GvGProvince.updateGuildData(oldGuild);
		GvGProvince.updateGuildData(newGuild);
	},

	updateGuildData: (guild) => {
		let tableRow = document.getElementById("id-"+guild.id);
		if (tableRow != null) {
			let html = '<td><span class="guildflag '+guild.flag+'" style="background-color: '+GvGProvince.colorToString(guild.color)+'"></span>'+guild.name+'</td>';
			html += '<td class="text-center">'+guild.sectors+'</td>';
			html += '<td class="text-center">'+guild.power+'</td>';
			tableRow.innerHTML = html;
		}
	},

	showSector: (sector) => {
		let html = '';
		if (sector.owner.name != undefined) {
			html = '<div class="sectorInfo">'
			html += '<span class="guildflag '+sector.owner.flag+'" style="background-color: '+GvGProvince.colorToString(sector.owner.color)+';border-color: '+GvGProvince.colorToString(sector.owner.color)+'"></span>';
			html += '<b class="text-bright">'+ sector.owner.name +'</b><br>';
			html += 'Hitpoints: '+ sector.hitpoints +'/80<br>';
			html += 'Coords: '+ sector.coords() +'<br>';
			html += 'Power: '+ sector.power +'<br>';
			if (sector.isProtected)
				html += 'Sector is protected<br>';
			html += 'Terrain: '+ sector.terrain +'<br>';
			if (sector.underSiege())
				html += 'Under Siege by: '+ sector.underSiege() +'<br>';
			html += '</div>';
		}
		document.getElementById("GvGMapInfo").innerHTML = html;
    },

	buildGuilds: () => {
        let t = [];

        GvGProvince.Guilds.sort(function(a, b) {
            if (a.power > b.power)
                return -1;
            if (a.power < b.power)
                return 1;
            return 0;
        });

		t.push('<table id="GvGGuilds" class="foe-table">');
		t.push('<thead><tr>');
		t.push('<th>Name</th>');
		t.push('<th>Sectors</th>');
		t.push('<th>Power</th>');
		t.push('</tr></thead>');
		GvGProvince.Guilds.forEach(function (guild) {
			t.push('<tr id="id-'+guild.id+'">');
			t.push('<td><span class="guildflag '+guild.flag+'" style="background-color: '+GvGProvince.colorToString(guild.color)+'"></span>'+guild.name+'</td>');
			t.push('<td class="text-center">'+guild.sectors+'</td>');
			t.push('<td class="text-center">'+guild.power+'</td>');
			t.push('</tr>');
		});
		t.push('</table>');

		$('#GvGMapGuilds').html(t.join(''));
	},

	getColor: (guild) => {
        flag = guild.flag.split("_") || null;
        let color = {"r":255,"g":255,"b":255};

        if (flag != null)  {
            if (flag[0].search("premium") >= 0) {
                color = GvGProvince.Colors.premium[flag[flag.length-1]-1];
			}
            else if (flag[flag.length - 1].toLowerCase() == "r") {
                color = GvGProvince.Colors.r[Math.round(guild.id/13)%13];
			}
            else if (flag[flag.length - 1].toLowerCase() == "g")
                color = GvGProvince.Colors.g[Math.round(guild.id/13)%13];
            else
				if (flag.length != 1)
					color = GvGProvince.Colors.b[Math.round(guild.id/13)%13];

        }

        return color;
    },

	getFlagImageCoordinates: (flag) => {
        let id = flag.split("_");

        if (id[id.length - 1].toLowerCase() == "r" || id[id.length - 1].toLowerCase() == "g")
            id = parseInt(id[id.length - 2]);
        else
            id = parseInt(id[id.length - 1]);

        if (flag.search("premium") >= 0)
            id += 40;

        return {"x": (id % 10 ) * (GvGProvince.HexWidth), "y": Math.floor(id / 10) * (GvGProvince.HexHeight)};
    },

	colorToString: (color) => {
		return "rgb("+color.r+","+color.g+","+color.b+")";
	},
}

class Sector {
	constructor(x, y, info) {
		this.position = {
			"x": x,
			"y": y
		};
		this.coordinates = {
			"x": info.position.x,
			"y": info.position.y
		};
		this.power = parseInt(GvGProvince.PowerValues[info.power]) || GvGProvince.PowerValues[0];
		this.powerMultiplicator = parseInt(info.power)+1 || 1;
		this.isProtected = info.is_protected;
		this.terrain = info.terrain;
		this.headquarter = (info.building != null);
		this.hitpoints = info.hitpoints;
		this.owner = this.findOwnerById(info.owner_id) || { id: 0, color: this.setColorByTerrain() };
		this.siege = {
			"clan": info.siege_clan_id || 0,
		};
	}

	findOwnerById(id) {
		let guild = GvGProvince.Guilds.find(x => x.id  === id);
		return guild;
	}

	underSiege() {
		if (this.siege.clan != 0)
			return GvGProvince.Guilds.find(x => x.id  === this.siege.clan).name;
		return false;
	}

	setColorByTerrain() {
		let color = {};
		if (this.terrain == "beach") {
			color = {"r":233,"g":233,"b":114-this.powerMultiplicator*10};
		}
		else if (this.terrain == "plain") {
			color = {"r":126-this.powerMultiplicator*10,"g":222-this.powerMultiplicator*10,"b":110-this.powerMultiplicator*10};
		}
		else {
			if (this.terrain == "rocks")
				color = {"r":50,"g":50,"b":50};
			if (this.terrain == "water")
				color = {"r":4,"g":28,"b":45};
		}
		return color;
	}

	/**
	 * Draws a sector on the map + flag and HQ/status if it has an owner
	 */
	draw() {
		this.drawHex();
		this.drawHexText();
		if (this.owner.id > 0) {
			let flag = this.owner.flagCoordinates;

			let img = new Image();
			img.src = 'https://tools.kingshood.de/gvg/img/flags_small.png';

			let sector = this;
			img.onload = function () {

				if (sector.headquarter)
					GvGProvince.MapCTX.drawImage(img, 450, 200, GvGProvince.HexWidth, GvGProvince.HexHeight, sector.position.x, sector.position.y, GvGProvince.HexWidth, GvGProvince.HexHeight);
				if (sector.isProtected)
					GvGProvince.MapCTX.drawImage(img, 400, 200, GvGProvince.HexWidth, GvGProvince.HexHeight, sector.position.x, sector.position.y, GvGProvince.HexWidth, GvGProvince.HexHeight);

				GvGProvince.MapCTX.drawImage(img, flag.x, flag.y, GvGProvince.HexWidth, GvGProvince.HexHeight, sector.position.x, sector.position.y-5, GvGProvince.HexWidth, GvGProvince.HexHeight);

			}
		}
	}

	/**
	 * Redraw
	 */
	redraw() {
		this.drawHex();
		this.drawHexText();
	}

	/**
	 * Draws Sector hexagon in its color
	 */
	drawHex() {
		GvGProvince.MapCTX.fillStyle = GvGProvince.colorToString(this.owner.color);
		GvGProvince.MapCTX.beginPath();
		GvGProvince.MapCTX.moveTo(this.position.x + GvGProvince.HexWidth / 2, this.position.y);
		GvGProvince.MapCTX.lineTo(this.position.x + GvGProvince.HexWidth, this.position.y + GvGProvince.HexHeight * 0.25);
		GvGProvince.MapCTX.lineTo(this.position.x + GvGProvince.HexWidth, this.position.y + GvGProvince.HexHeight * 0.75);
		GvGProvince.MapCTX.lineTo(this.position.x + GvGProvince.HexWidth / 2, this.position.y + GvGProvince.HexHeight);
		GvGProvince.MapCTX.lineTo(this.position.x, this.position.y + GvGProvince.HexHeight * 0.75);
		GvGProvince.MapCTX.lineTo(this.position.x, this.position.y + GvGProvince.HexHeight * 0.25);
		GvGProvince.MapCTX.closePath();
		GvGProvince.MapCTX.fill();
		GvGProvince.MapCTX.strokeStyle = "rgba(0,0,0,0.2)";
		GvGProvince.MapCTX.stroke();
	}

	/**
	 * Draws Sector coordinates (and power)
	 */
	drawHexText() {
		GvGProvince.MapCTX.font = "9px Arial";
		GvGProvince.MapCTX.textAlign = "center";
		GvGProvince.MapCTX.fillStyle = ((this.owner.color.r+this.owner.color.g+this.owner.color.b) < 420) ? '#ddd' : '#222';
		GvGProvince.MapCTX.fillText(this.coords(), this.position.x + GvGProvince.HexWidth / 2, this.position.y + GvGProvince.HexHeight * 0.8);
		if (this.owner.id == 0 && this.terrain != "water" && this.terrain != "rocks")
			GvGProvince.MapCTX.fillText(this.power, this.position.x + GvGProvince.HexWidth / 2, this.position.y + GvGProvince.HexHeight * 0.3);
	}

	/**
	 * Returns Sectors coordinates (with ~ if beach)
	 */
	coords() {
		if (this.terrain == "beach")
			return "~"+this.coordinates.x + ", " + this.coordinates.y+"~";
		GvGProvince.MapCTX.font = "bold 10px Arial";
		if (this.terrain == "plain")
			return this.coordinates.x + ", " + this.coordinates.y;
		return "";
	}
}