/* heatpump-card – Air-to-air heat pump card for Home Assistant (Panasonic via ESPthings etc.) */
const HP_SZ = {};
const HP_VERSION = '1.0.0';
const HP_I18N = {
  en: { heat:'Heat', cool:'Cool', dry:'Dry', fan_only:'Fan', heat_cool:'Auto', off:'Off', heating:'Heating', cooling:'Cooling', drying:'Drying', fan:'Fan', idle:'Idle', target:'Target', room:'Room', unit:'Unit', outdoor:'Outside', power:'Power', today:'Today', yesterday:'Yesterday', total:'Total', setpoint:'Setpoint', fan_speed:'Fan speed', preset:'Preset', swing:'Air direction', auto:'Auto', Automatic:'Auto', Normal:'Normal', Powerful:'Powerful', Quiet:'Quiet', none:'Normal', away:'Away', low:'Low', medium:'Medium', high:'High', middle:'Middle', min:'Min', max:'Max', focus:'Focus', diffuse:'Diffuse', vertical:'Swing', up:'Up', up_center:'Up-mid', center:'Middle', down_center:'Down-mid', down:'Down', swingopt:'Swing', nanoe:'nanoe X', missing:'Entity not found', e_entity:'Climate entity', e_name:'Name', e_room:'Room temperature sensor', e_outdoor:'Outdoor temperature sensor', e_power:'Power sensor', e_energy:'Energy today sensor', e_yesterday:'Energy yesterday sensor', e_total:'Energy total sensor', e_swing:'Vertical swing select', e_nanoe:'nanoe switch', e_lang:'Language (auto/de/no/en)', e_use_room:'Use room sensor as current temperature' },
  de: { heat:'Heizen', cool:'Kühlen', dry:'Trocknen', fan_only:'Lüfter', heat_cool:'Auto', off:'Aus', heating:'Heizt', cooling:'Kühlt', drying:'Trocknet', fan:'Lüfter', idle:'Bereit', target:'Soll', room:'Raum', unit:'Gerät', outdoor:'Außen', power:'Leistung', today:'Heute', yesterday:'Gestern', total:'Gesamt', setpoint:'Soll Gerät', fan_speed:'Lüfterstufe', preset:'Preset', swing:'Luftrichtung', auto:'Auto', Automatic:'Auto', Normal:'Normal', Powerful:'Power', Quiet:'Leise', none:'Normal', away:'Abwesend', low:'Niedrig', medium:'Mittel', high:'Hoch', middle:'Mitte', min:'Min', max:'Max', focus:'Fokus', diffuse:'Diffus', vertical:'Schwenken', up:'Oben', up_center:'Oben-Mitte', center:'Mitte', down_center:'Unten-Mitte', down:'Unten', swingopt:'Schwenken', nanoe:'nanoe X', missing:'Entität nicht gefunden', e_entity:'Climate-Entität', e_name:'Name', e_room:'Raumtemperatur-Sensor', e_outdoor:'Außentemperatur-Sensor', e_power:'Leistungs-Sensor', e_energy:'Energie-heute-Sensor', e_yesterday:'Energie-gestern-Sensor', e_total:'Energie-gesamt-Sensor', e_swing:'Vertikale Lamelle (select)', e_nanoe:'nanoe-Schalter', e_lang:'Sprache (auto/de/no/en)', e_use_room:'Raumsensor als Ist-Temperatur nutzen' },
  no: { heat:'Varme', cool:'Kjøling', dry:'Tørk', fan_only:'Vifte', heat_cool:'Auto', off:'Av', heating:'Varmer', cooling:'Kjøler', drying:'Tørker', fan:'Vifte', idle:'Klar', target:'Mål', room:'Rom', unit:'Enhet', outdoor:'Ute', power:'Effekt', today:'I dag', yesterday:'I går', total:'Totalt', setpoint:'Settpunkt', fan_speed:'Viftehastighet', preset:'Preset', swing:'Luftretning', auto:'Auto', Automatic:'Auto', Normal:'Normal', Powerful:'Kraftig', Quiet:'Stille', none:'Normal', away:'Borte', low:'Lav', medium:'Middels', high:'Høy', middle:'Midt', min:'Min', max:'Maks', focus:'Fokus', diffuse:'Diffus', vertical:'Sving', up:'Opp', up_center:'Opp-midt', center:'Midt', down_center:'Ned-midt', down:'Ned', swingopt:'Sving', nanoe:'nanoe X', missing:'Entitet ikke funnet', e_entity:'Climate-entitet', e_name:'Navn', e_room:'Romtemperatursensor', e_outdoor:'Utetemperatursensor', e_power:'Effektsensor', e_energy:'Energi i dag-sensor', e_yesterday:'Energi i går-sensor', e_total:'Energi totalt-sensor', e_swing:'Vertikal sving (select)', e_nanoe:'nanoe-bryter', e_lang:'Språk (auto/de/no/en)', e_use_room:'Bruk romsensor som faktisk temperatur' }
};
const HP_MODES = { heat:['mdi:fire','#FB8C00'], cool:['mdi:snowflake','#1E88E5'], dry:['mdi:water-percent','#FDD835'], fan_only:['mdi:fan','#9E9E9E'], heat_cool:['mdi:autorenew','#43A047'], auto:['mdi:autorenew','#43A047'], off:['mdi:power','#757575'] };
const HP_ANGLE = { up:-48, up_center:-24, center:0, down_center:24, down:48, auto:0, swing:0 };

class HeatpumpCard extends HTMLElement {
  constructor(){ super(); this.attachShadow({mode:'open'}); this._built=false; this._pending=null; }
  static defaultTiles(c0,o){ const T=k=>o._t(k); const tiles=[];
      if(c0.power_entity) tiles.push({entity:c0.power_entity,icon:'⚡',name:T('power'),unit:'W',decimals:0});
      if(c0.energy_entity) tiles.push({entity:c0.energy_entity,icon:'📈',name:T('today')});
      if(c0.yesterday_entity) tiles.push(c0.yesterday_attribute?{entity:c0.yesterday_entity,attribute:c0.yesterday_attribute,unit:'kWh',icon:'📅',name:T('yesterday')}:{entity:c0.yesterday_entity,icon:'📅',name:T('yesterday')});
      if(c0.room_entity&&c0.show_room===false) tiles.push({entity:c0.room_entity,icon:'🌡️',name:T('room'),unit:'°C'});
      if(c0.show_unit_temp!==false) tiles.push({entity:'unit_temp',icon:'🌡️',name:T('unit')});
      if(c0.show_setpoint!==false) tiles.push({entity:'setpoint',icon:'🎯',name:T('setpoint')});
      if(c0.outdoor_entity) tiles.push({entity:c0.outdoor_entity,icon:'❄️',name:T('outdoor'),unit:'°C'});
      if(c0.total_entity) tiles.push({entity:c0.total_entity,icon:'🔌',name:T('total')});
      return tiles; }
  static getConfigElement(){ return document.createElement('heatpump-card-editor'); }
  static getStubConfig(hass){
    const c = Object.keys(hass.states).find(e=>e.startsWith('climate.')) || 'climate.heatpump';
    return { entity:c };
  }
  setConfig(c){ if(!c || !c.entity) throw new Error('entity required'); this._cfg = Object.assign({use_room_sensor:true}, c); this._built=false; if(this._hass) this._render(); }
  set hass(h){ this._hass=h; if(!this._built) this._render(); else this._update(); }
  getCardSize(){ return 6; }
  _mc(m){ const k=(m==='heat_cool')?'auto':m; return this._cfg['color_'+k]||(HP_MODES[m]||[0,'#757575'])[1]; }
  _t(k){ const l=(this._cfg.language&&this._cfg.language!=='auto')?this._cfg.language:((this._hass&&this._hass.language)||'en').slice(0,2); const r=((HP_I18N[l]||HP_I18N.en)[k]) ?? HP_I18N.en[k]; if(r!==undefined) return r; k=String(k); return k.charAt(0).toUpperCase()+k.slice(1); }
  _call(d,s,data){ this._hass.callService(d,s,data); }
  _num(id){ if(!id) return null; const s=this._hass.states[id]; if(!s) return null; const v=parseFloat(s.state); return isNaN(v)?null:v; }
  _render(){
    if(!this._hass||!this._cfg) return;
    const st=this._hass.states[this._cfg.entity];
    const root=this.shadowRoot;
    if(!st){ root.innerHTML=`<ha-card><div style="padding:16px">${this._t('missing')}: ${this._cfg.entity}</div></ha-card>`; this._built=false; return; }
    const sel=(all,pick)=>Array.isArray(pick)&&pick.length?pick.map(String).filter(x=>all.map(String).includes(x)):all;
    const modes=sel(st.attributes.hvac_modes||[],this._cfg.modes);
    const fans=sel(st.attributes.fan_modes||[],this._cfg.fan_modes); const presets=sel(st.attributes.preset_modes||[],this._cfg.preset_modes);
    const LB=(o,k,d)=>(o&&o[k]!==undefined)?o[k]:d;
    const swSel=this._cfg.swing_entity && this._hass.states[this._cfg.swing_entity];
    const swOpts=sel(swSel?(swSel.attributes.options||[]):(st.attributes.swing_modes||[]).filter(m=>m==='off'||m==='vertical'),this._cfg.swing_modes);
    const c=this._cfg; let imgSvg='';
    if(c.image){
      const sz=HP_SZ[c.image]; if(!sz){ const im=new Image(); im.onload=()=>{ HP_SZ[c.image]=[im.naturalWidth,im.naturalHeight]; if(this._cfg===c){ this._built=false; this._render(); } }; im.src=c.image; }
      const T=c.image_top!=null?+c.image_top:150, VW=595, VH=sz?Math.round(VW*sz[1]/sz[0]):531;
      const A=c.image_air||[.13,.043,.76,.092]; const P1=[A[0]*VW,A[1]*VH], P2=[A[2]*VW,A[3]*VH], M=[(P1[0]+P2[0])/2,(P1[1]+P2[1])/2];
      this._air={P1,P2,M,VW,VH};
      let glow=''; if(Array.isArray(c.image_glow)){ const L=Math.hypot(P2[0]-P1[0],P2[1]-P1[1]), an=Math.atan2(P2[1]-P1[1],P2[0]-P1[0])*180/Math.PI; glow=`<ellipse id="led" cx="${(M[0]+c.image_glow[0]*VW).toFixed(1)}" cy="${(M[1]+c.image_glow[1]*VH).toFixed(1)}" rx="${(L*0.47).toFixed(1)}" ry="9" transform="rotate(${an.toFixed(1)} ${(M[0]+c.image_glow[0]*VW).toFixed(1)} ${(M[1]+c.image_glow[1]*VH).toFixed(1)})" fill="#9E9E9E" opacity="0"/>`; } else glow=`<ellipse id="led" cx="0" cy="0" rx="0" ry="0" opacity="0"/>`;
      imgSvg=`<svg viewBox="0 ${-T} ${VW} ${VH+T+(c.image_bottom!=null?+c.image_bottom:45)}" id="svg"><image id="imgon" href="${c.image}" x="0" y="0" width="${VW}" height="${VH}"/>${c.image_off?`<image id="imgoff" href="${c.image_off}" x="0" y="0" width="${VW}" height="${VH}" preserveAspectRatio="xMidYMax meet" style="display:none"/>`:''}${glow}<g transform="translate(${M[0].toFixed(1)} ${M[1].toFixed(1)})"><g id="swgi"><g class="air" id="air"><g id="airg"></g></g></g></g></svg>`;
    }
    root.innerHTML=`<style>
:host{display:block}
ha-card{padding:14px 16px 16px;overflow:hidden}
.hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
.nm{font-size:1.15em;font-weight:500;color:var(--primary-text-color)}
.chip{font-size:.8em;padding:3px 10px;border-radius:12px;background:var(--hp,#757575);color:#fff;transition:background .3s}
.stage{position:relative;display:flex;flex-direction:column;align-items:center;gap:0}
.unit{flex:none;width:86%;max-width:100%;min-width:0;margin:-6px auto 0}
.unit svg{width:100%;height:auto;display:block;overflow:visible}
.rm{position:absolute;left:0;top:74px;display:flex;align-items:center;gap:4px;cursor:pointer;z-index:2;padding:2px 4px;border-radius:10px}.rm:hover{background:var(--secondary-background-color)}.rm ha-icon{--mdc-icon-size:26px;color:var(--hp,var(--primary-color))}.rm .rv{font-size:1.5em;font-weight:400;line-height:1;color:var(--primary-text-color)}.rm .rl{font-size:.62em;color:var(--secondary-text-color);text-transform:uppercase;letter-spacing:.04em;display:block}
.tgt{display:flex;align-items:center;justify-content:center;gap:22px;margin-top:2px;text-align:center}
.tc{min-width:150px}
.tgt .lb{font-size:.75em;color:var(--secondary-text-color);text-transform:uppercase;letter-spacing:.05em}
.tgt .v{font-size:2.6em;font-weight:300;line-height:1.05;color:var(--primary-text-color)}
.tgt .v small{font-size:.4em;vertical-align:top;margin-left:2px;color:var(--secondary-text-color)}
.rb{width:42px;height:42px;border-radius:50%;border:1px solid var(--divider-color);background:var(--card-background-color);color:var(--primary-text-color);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}
.rb:active{background:var(--hp,#888);color:#fff}
.info{display:grid;gap:6px;margin:10px 0 8px}
.ib{cursor:pointer;transition:filter .15s;text-align:center;padding:6px 2px;border-radius:10px;background:var(--secondary-background-color)}
.ib:hover{filter:brightness(.94)}
.ib:active{filter:brightness(.88)}
.ib .l{font-size:.68em;color:var(--secondary-text-color)}
.ib .n{font-size:1em;font-weight:500;color:var(--primary-text-color)}
.row{display:flex;gap:6px;margin:8px 0 0;flex-wrap:wrap}
.sec{font-size:.72em;color:var(--secondary-text-color);margin:10px 0 0;text-transform:uppercase;letter-spacing:.05em}
.b{flex:1 1 0;min-width:0;padding:8px 4px;border-radius:10px;border:1px solid var(--divider-color);background:transparent;color:var(--primary-text-color);cursor:pointer;font:inherit;font-size:.82em;display:flex;flex-direction:column;align-items:center;gap:2px}
.b ha-icon{--mdc-icon-size:20px}
.b.on{background:var(--c,var(--hp,var(--primary-color)));border-color:var(--c,var(--hp,var(--primary-color)));color:#fff}
.b.sm{flex-direction:row;justify-content:center;padding:7px 4px}
.disabled{opacity:.45;pointer-events:none}
.lv{transform-origin:0 0;transition:transform .5s}
.lv.sw{animation:swg 3s ease-in-out infinite alternate}
@keyframes swg{from{transform:rotate(-48deg)}to{transform:rotate(48deg)}}
.air{opacity:0;transition:opacity .4s}
.air.on{opacity:1}
.ar{opacity:0;animation:arw var(--d,1.2s) linear infinite;animation-delay:var(--dl,0s)}
.ar path{fill:none;stroke:var(--ar,#E53935);stroke-width:4.6px;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}
@keyframes arw{0%{transform:translateX(0);opacity:0}18%{opacity:1}75%{opacity:1}100%{transform:translateX(var(--len,60px));opacity:0}}
#swgi{transform-origin:0 0}
#swgi.sw2{animation:sw2 3s ease-in-out infinite alternate}
@keyframes sw2{from{transform:rotate(-26deg)}to{transform:rotate(26deg)}}
@keyframes af{to{stroke-dashoffset:-20}}
</style>
<ha-card>
 <div class="hd"><div class="nm" id="nm"></div><div class="chip" id="chip"></div></div>
 <div class="stage">
  ${(c.room_entity&&c.show_room!==false)?`<div class="rm" id="rm"><ha-icon icon="mdi:thermometer"></ha-icon><div><span class="rl" id="rl"></span><span class="rv" id="rvv">--</span></div></div>`:''}
  <div class="tgt"><button class="rb" id="dn"><ha-icon icon="mdi:minus"></ha-icon></button><div class="tc"><div class="lb" id="tl"></div><div class="v"><span id="tv">--</span><small>°C</small></div></div><button class="rb" id="up"><ha-icon icon="mdi:plus"></ha-icon></button></div>
  <div class="unit">
   ${this._cfg.image?imgSvg:`<svg viewBox="0 -45 300 195" id="svg">
    <defs><linearGradient id="bd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F5F5F5"/><stop offset="1" stop-color="#DADADA"/></linearGradient></defs>
    <rect x="8" y="132" width="284" height="8" rx="4" fill="#000" opacity=".08"/>
    <g class="air" id="air" style="transform-origin:0 0">
     <g id="airg"></g>
    </g>
    <rect x="30" y="54" width="240" height="78" rx="14" fill="url(#bd)" stroke="#BDBDBD"/>
    <rect x="46" y="96" width="208" height="26" rx="6" fill="#CFCFCF"/>
    <g stroke="#B0B0B0" stroke-width="1.5">${[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26].map(i=>`<line x1="${52+i*7.4}" y1="100" x2="${52+i*7.4}" y2="118"/>`).join('')}</g>
    <rect x="46" y="62" width="208" height="20" rx="6" fill="#EDEDED" stroke="#C8C8C8"/>
    <circle cx="238" cy="72" r="3.5" id="led" fill="#9E9E9E"/>
    <g id="lvwrap" transform="translate(212 62)"><g class="lv" id="lv"><rect x="0" y="-3" width="42" height="6" rx="3" fill="#9E9E9E"/></g></g>
   </svg>`}
  </div>
 </div>
 ${c.show_info!==false?`<div class="info" id="info"></div>`:''}
 ${c.show_modes!==false?`<div class="row" id="modes"></div>`:''}
 ${fans.length&&c.show_fan!==false?`<div class="sec" id="fl"></div><div class="row" id="fans"></div>`:''}
 ${presets.length&&c.show_preset!==false?`<div class="sec" id="pl"></div><div class="row" id="pre"></div>`:''}
 ${swOpts.length&&c.show_swing!==false?`<div class="sec" id="sl"></div><div class="row" id="sws"></div>`:''}
 ${this._cfg.nanoe_entity?`<div class="row" id="nn"></div>`:''}
</ha-card>`;
    const $=s=>root.getElementById(s);
    $('dn').onclick=()=>this._step(-0.5); $('up').onclick=()=>this._step(0.5);
    const mk=(el,items,fn)=>{ el.innerHTML=''; items.forEach(([v,label,icon,color])=>{ const b=document.createElement('button'); b.className='b'+(icon?'':' sm'); b.dataset.v=v; if(color) b.style.setProperty('--c',color); b.innerHTML=(icon?`<ha-icon icon="${icon}"></ha-icon>`:'')+`<span>${label}</span>`; b.onclick=()=>fn(v); el.appendChild(b); }); };
    if($('modes')) mk($('modes'), modes.map(m=>[m,LB(this._cfg.mode_labels,m,this._t(m)),(HP_MODES[m]||['mdi:help'])[0],this._mc(m)]), v=>this._call('climate','set_hvac_mode',{entity_id:this._cfg.entity,hvac_mode:v}));
    if($('fans')) mk($('fans'), fans.map(f=>[f,LB(this._cfg.fan_labels,f,this._t(f))]), v=>this._call('climate','set_fan_mode',{entity_id:this._cfg.entity,fan_mode:v}));
    if($('pre')) mk($('pre'), presets.map(f=>[f,LB(this._cfg.preset_labels,f,this._t(f))]), v=>this._call('climate','set_preset_mode',{entity_id:this._cfg.entity,preset_mode:v}));
    if($('sws')) mk($('sws'), swOpts.map(f=>[f,LB(this._cfg.swing_labels,f,this._t(f==='swing'?'swingopt':f==='off'?'off':f))]), v=>swSel?this._call('select','select_option',{entity_id:this._cfg.swing_entity,option:v}):this._call('climate','set_swing_mode',{entity_id:this._cfg.entity,swing_mode:v}));
    if(this._cfg.nanoe_entity){ mk($('nn'), [['t',this._t('nanoe'),'mdi:air-filter']], ()=>this._call('homeassistant','toggle',{entity_id:this._cfg.nanoe_entity})); }
    this._built=true; this._update();
  }
  _step(d){
    const st=this._hass.states[this._cfg.entity]; if(!st) return;
    const a=st.attributes; const step=a.target_temp_step||0.5;
    let t=(this._pending!=null?this._pending:a.temperature); if(t==null) return;
    t=Math.min(a.max_temp||30,Math.max(a.min_temp||16,Math.round((t+(d>0?step:-step))/step)*step));
    this._pending=t; this.shadowRoot.getElementById('tv').textContent=t.toFixed(1);
    clearTimeout(this._tm); this._tm=setTimeout(()=>{ this._call('climate','set_temperature',{entity_id:this._cfg.entity,temperature:t}); setTimeout(()=>{this._pending=null;},1500); },700);
  }
  _update(){
    const root=this.shadowRoot, st=this._hass.states[this._cfg.entity]; if(!st||!this._built) return;
    const $=s=>root.getElementById(s), a=st.attributes, mode=st.state;
    const col=this._mc(mode);
    const act=a.hvac_action;
    const running = mode!=='off' && act!=='idle' && act!=='off';
    const actTxt = mode==='off'?this._t('off'):(act==='heating'?this._t('heating'):act==='cooling'?this._t('cooling'):act==='drying'?this._t('drying'):act==='fan'?this._t('fan'):act==='idle'?this._t('idle'):this._t(mode));
    $('nm').textContent=this._cfg.name||a.friendly_name||this._cfg.entity;
    const chip=$('chip'); chip.textContent=actTxt; root.querySelector('ha-card').style.setProperty('--hp',col);
    $('tl').textContent=this._t('target');
    if(this._pending==null) $('tv').textContent=(a.temperature!=null&&mode!=='off'&&mode!=='fan_only')?Number(a.temperature).toFixed(1):'--';
    { const led=$('led'); led.setAttribute('fill', mode==='off'?'#9E9E9E':col); if(this._cfg.image) led.setAttribute('opacity', (mode!=='off'&&act!=='idle')?'.35':'0'); }
    if($('rm')){ const rv=this._num(this._cfg.room_entity); $('rvv').textContent=rv!=null?rv.toFixed(1)+' °C':'--'; $('rl').textContent=this._t('room'); $('rm').onclick=()=>this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:this._cfg.room_entity},bubbles:true,composed:true})); }
    // info tiles (configurable: cfg.tiles = [{entity,name,attribute,unit,decimals,icon,span}], tokens unit_temp / setpoint)
    const c0=this._cfg; const tiles=Array.isArray(c0.tiles)?c0.tiles:HeatpumpCard.defaultTiles(c0,this);
    const items=[];
    tiles.forEach(tl=>{
      if(!tl||!tl.entity) return; let e=tl.entity, v, u=tl.unit, raw, nm=tl.name;
      if(e==='unit_temp'){ if(a.current_temperature==null) return; raw=a.current_temperature; e=c0.entity; u=u??'°C'; nm=nm??this._t('unit'); }
      else if(e==='setpoint'){ if(a.temperature==null||mode==='off') return; raw=a.temperature; e=c0.entity; u=u??'°C'; nm=nm??this._t('setpoint'); }
      else { const s2=this._hass.states[e]; if(!s2) return; raw=tl.attribute?s2.attributes[tl.attribute]:s2.state; if(raw==null||raw==='unavailable'||raw==='unknown') return; const eu=s2.attributes.unit_of_measurement; nm=nm??s2.attributes.friendly_name??e; v=parseFloat(raw); if(!isNaN(v)){ if(u==null&&!tl.attribute&&eu==='Wh'){ v/=1000; u='kWh'; } else if(u==null&&!tl.attribute) u=eu; } }
      if(v===undefined) v=parseFloat(raw);
      const dec=tl.decimals!=null?+tl.decimals:(u==='W'?0:1);
      const txt=isNaN(v)?String(raw):v.toFixed(dec)+(u?' '+u:'');
      const ic=tl.icon?(/^[a-z-]+:/.test(tl.icon)?`<ha-icon icon="${tl.icon}" style="--mdc-icon-size:14px;vertical-align:-3px"></ha-icon> `:tl.icon+' '):'';
      items.push([ic+nm,txt,e,Math.max(1,Math.min(4,+tl.span||1))]);
    });
    if($('info')){ $('info').style.gridTemplateColumns=c0.info_columns?`repeat(${+c0.info_columns},1fr)`:'repeat(auto-fit,minmax(78px,1fr))';
    $('info').innerHTML=items.map(([l,n,e,sp])=>`<div class="ib" data-e="${e}" title="${e}"${sp>1?` style="grid-column:span ${sp}"`:''}><div class="l">${l}</div><div class="n">${n}</div></div>`).join('');
    $('info').onclick=ev=>{ const t=ev.target.closest('.ib'); if(!t) return; this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:t.dataset.e},bubbles:true,composed:true})); }; }
    // buttons
    const setOn=(id,val)=>{ const el=$(id); if(!el) return; el.querySelectorAll('.b').forEach(b=>b.classList.toggle('on',b.dataset.v===val)); };
    setOn('modes',mode); setOn('fans',String(a.fan_mode)); setOn('pre',a.preset_mode==null?'none':a.preset_mode);
    const sw=this._cfg.swing_entity&&this._hass.states[this._cfg.swing_entity]; const swv=sw?sw.state:a.swing_mode;
    setOn('sws',swv);
    if($('fl')) $('fl').textContent=this._t('fan_speed'); if($('pl')) $('pl').textContent=this._t('preset'); if($('sl')) $('sl').textContent=this._t('swing');
    ['fans','pre','sws'].forEach(id=>{ const el=$(id); if(el) el.classList.toggle('disabled',mode==='off'); });
    if(this._cfg.nanoe_entity){ const n=this._hass.states[this._cfg.nanoe_entity]; const b=root.querySelector('#nn .b'); if(b){ b.classList.toggle('on',n&&n.state==='on'); b.style.setProperty('--c','#26A69A'); } }
    // louver + air
    const lv=$('lv'); const isSwing = swv==='swing' || (!sw && a.swing_mode&&a.swing_mode!=='off'&&a.swing_mode!=='horizontal');
    const air=$('air'); air.classList.toggle('on',running&&this._cfg.show_arrows!==false);
    const g=$('airg');
    // fan level 1..5 -> number, size, length and speed of the arrows
    const fm=String(a.fan_mode??'').toLowerCase(); const pr=String(a.preset_mode??'').toLowerCase();
    const LV={min:1,quiet:1,low:2,medium:3,middle:3,focus:3,diffuse:3,auto:3,automatic:3,high:4,max:5,powerful:5};
    let lvl=/^[1-5]$/.test(fm)?+fm:(LV[fm]??3); if(pr==='powerful') lvl=5; else if(pr==='quiet') lvl=Math.min(lvl,1);
    const img=!!this._cfg.image; const n=[2,3,4,5,6][lvl-1];
    let dir, key;
    if(img){
      if($('imgoff')){ $('imgoff').style.display=mode==='off'?'':'none'; $('imgon').style.display=mode==='off'?'none':''; }
      // 3D view: front face points to the viewer, down-left on screen (depth axis = side panel, up-right)
      const F=this._cfg.image_front||[-0.93,0.37]; const EL={up:68,up_center:42,center:12,down_center:-18,down:-42,auto:20,swing:20};
      const e=((EL[isSwing?'swing':swv]??20)+(+this._cfg.image_tilt||0))*Math.PI/180;
      dir=Math.round(Math.atan2(Math.cos(e)*F[1]-Math.sin(e),Math.cos(e)*F[0])*180/Math.PI);
      $('swgi').classList.toggle('sw2', isSwing && mode!=='off');
    } else {
      lv.classList.toggle('sw', isSwing && mode!=='off');
      const ang = isSwing?0:(HP_ANGLE[swv]??0); dir=ang;
      if(!isSwing) lv.style.transform=`rotate(${ang}deg)`; else lv.style.transform='';
      $('lv').firstElementChild.setAttribute('fill', mode==='off'?'#9E9E9E':col);
    }
    key=[img,lvl,dir,n,JSON.stringify(this._cfg.image_air||0)].join('|');
    if(g.dataset.key!==key){
      g.dataset.key=key; let h='';
      const sz=(0.85+0.18*lvl)*(img?1.25:0.6), len=(img?(30+16*lvl):(16+9*lvl)), dur=(1.7-0.22*lvl).toFixed(2);
      for(let i=0;i<n;i++){
        const f=n>1?i/(n-1):.5;
        let x,y,r;
        if(img){ const q=this._air; const ff=.14+f*.76; x=q.P1[0]+(q.P2[0]-q.P1[0])*ff-q.M[0]; y=q.P1[1]+(q.P2[1]-q.P1[1])*ff-q.M[1]; r=dir; }
        else { const rad=dir*Math.PI/180; x=0; y=(f-.5)*30; r=0; }
        const tr=img?`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r})`:`translate(0 ${y.toFixed(1)})`;
        h+=`<g transform="${tr}"><g class="ar" style="--len:${len}px;--d:${dur}s;--dl:-${(i*dur/n).toFixed(2)}s"><path transform="scale(${sz.toFixed(2)})" d="M0 0H26M18 -7L26 0L18 7"/></g></g>`;
      }
      g.innerHTML=h;
      if(!img){ const rad=dir*Math.PI/180; g.setAttribute('transform',`translate(${(212+42*Math.cos(rad)+4).toFixed(1)} ${(62+42*Math.sin(rad)).toFixed(1)}) rotate(${dir})`); } else g.removeAttribute('transform');
    }
    air.style.setProperty('--hp',col); air.style.setProperty('--ar',this._cfg.color_arrow||col);
    // flow direction: from unit front towards the right
  }
}
customElements.define('heatpump-card', HeatpumpCard);

const HP_ED = {
  en:{show_room:'Room temperature (large, top left)',g_btn:'Buttons',g_tiles:'Info tiles',modes:'Modes to show (order = selection order)',fan_modes:'Fan levels to show',preset_modes:'Presets to show',swing_modes:'Air direction options to show',mode_labels:'Mode labels (YAML: value: label)',fan_labels:'Fan labels (YAML)',preset_labels:'Preset labels (YAML)',swing_labels:'Air direction labels (YAML)',info_columns:'Tile columns (empty = auto)',t_entity:'Entity',t_name:'Name',t_attribute:'Attribute (optional)',t_unit:'Unit (optional)',t_decimals:'Decimals',t_icon:'Icon (mdi:... or emoji)',t_span:'Width (1-4 columns)',t_add:'+ Tile',t_unit_temp:'+ Unit temp.',t_setpoint:'+ Unit setpoint',t_defaults:'Load default tiles',t_clear:'Remove all (back to automatic)',t_auto:'Tiles are automatic from the sensors above. Load them to edit, reorder or add your own.',t_special_unit_temp:'Unit temperature',t_special_setpoint:'Unit setpoint',entity:'Climate entity',name:'Name',language:'Language',g_ent:'Sensors & entities',g_img:'Images',g_show:'Sections',g_col:'Colors',
   room_entity:'Room temperature sensor',outdoor_entity:'Outdoor temperature sensor',power_entity:'Power sensor (W)',energy_entity:'Energy today sensor',yesterday_entity:'Energy yesterday sensor',yesterday_attribute:'Yesterday attribute (e.g. last_period)',total_entity:'Energy total sensor',swing_entity:'Air direction select (optional)',nanoe_entity:'nanoe / extra switch (optional)',
   image:'Image (URL or /local/..., empty = drawn unit)',image_off:'Image when off (optional)',
   show_info:'Info tiles',show_unit_temp:'Tile: unit temperature',show_setpoint:'Tile: unit setpoint',show_modes:'Mode buttons',show_fan:'Fan speed',show_preset:'Preset',show_swing:'Air direction',show_arrows:'Air flow arrows',
   color_arrow:'Arrow color (empty = mode color)',color_heat:'Heat',color_cool:'Cool',color_dry:'Dry',color_fan_only:'Fan only',color_auto:'Auto'},
  de:{show_room:'Raumtemperatur (groß, oben links)',g_btn:'Knöpfe',g_tiles:'Infokacheln',modes:'Anzuzeigende Modi (Reihenfolge = Auswahlreihenfolge)',fan_modes:'Anzuzeigende Lüfterstufen',preset_modes:'Anzuzeigende Presets',swing_modes:'Anzuzeigende Luftrichtungen',mode_labels:'Modus-Beschriftung (YAML: Wert: Text)',fan_labels:'Lüfter-Beschriftung (YAML)',preset_labels:'Preset-Beschriftung (YAML)',swing_labels:'Luftrichtung-Beschriftung (YAML)',info_columns:'Kachel-Spalten (leer = automatisch)',t_entity:'Entität',t_name:'Name',t_attribute:'Attribut (optional)',t_unit:'Einheit (optional)',t_decimals:'Nachkommastellen',t_icon:'Icon (mdi:... oder Emoji)',t_span:'Breite (1-4 Spalten)',t_add:'+ Kachel',t_unit_temp:'+ Gerätetemp.',t_setpoint:'+ Soll Gerät',t_defaults:'Standard-Kacheln laden',t_clear:'Alle entfernen (zurück zu automatisch)',t_auto:'Kacheln sind automatisch aus den Sensoren oben. Laden, um sie zu bearbeiten, zu sortieren oder eigene hinzuzufügen.',t_special_unit_temp:'Gerätetemperatur',t_special_setpoint:'Soll Gerät',entity:'Climate-Entität',name:'Name',language:'Sprache',g_ent:'Sensoren & Entitäten',g_img:'Bilder',g_show:'Bereiche',g_col:'Farben',
   room_entity:'Raumtemperatur-Sensor',outdoor_entity:'Außentemperatur-Sensor',power_entity:'Leistungs-Sensor (W)',energy_entity:'Energie-heute-Sensor',yesterday_entity:'Energie-gestern-Sensor',yesterday_attribute:'Gestern-Attribut (z. B. last_period)',total_entity:'Energie-gesamt-Sensor',swing_entity:'Luftrichtung-Select (optional)',nanoe_entity:'nanoe / Zusatzschalter (optional)',
   image:'Bild (URL oder /local/..., leer = gezeichnetes Gerät)',image_off:'Bild wenn aus (optional)',
   show_info:'Infokacheln',show_unit_temp:'Kachel: Gerätetemperatur',show_setpoint:'Kachel: Soll Gerät',show_modes:'Modus-Knöpfe',show_fan:'Lüfterstufe',show_preset:'Preset',show_swing:'Luftrichtung',show_arrows:'Luftstrom-Pfeile',
   color_arrow:'Pfeilfarbe (leer = Modusfarbe)',color_heat:'Heizen',color_cool:'Kühlen',color_dry:'Trocknen',color_fan_only:'Lüfter',color_auto:'Auto'},
  no:{show_room:'Romtemperatur (stor, øverst til venstre)',g_btn:'Knapper',g_tiles:'Infofliser',modes:'Moduser som vises (rekkefølge = valgrekkefølge)',fan_modes:'Viftetrinn som vises',preset_modes:'Forhåndsvalg som vises',swing_modes:'Luftretninger som vises',mode_labels:'Modusnavn (YAML: verdi: tekst)',fan_labels:'Viftenavn (YAML)',preset_labels:'Forhåndsvalgnavn (YAML)',swing_labels:'Luftretningnavn (YAML)',info_columns:'Flis-kolonner (tomt = auto)',t_entity:'Entitet',t_name:'Navn',t_attribute:'Attributt (valgfritt)',t_unit:'Enhet (valgfritt)',t_decimals:'Desimaler',t_icon:'Ikon (mdi:... eller emoji)',t_span:'Bredde (1-4 kolonner)',t_add:'+ Flis',t_unit_temp:'+ Enhetstemp.',t_setpoint:'+ Settpunkt',t_defaults:'Last standardfliser',t_clear:'Fjern alle (tilbake til automatisk)',t_auto:'Flisene er automatiske fra sensorene over. Last dem for å redigere, sortere eller legge til egne.',t_special_unit_temp:'Enhetstemperatur',t_special_setpoint:'Settpunkt enhet',entity:'Climate-entitet',name:'Navn',language:'Språk',g_ent:'Sensorer og entiteter',g_img:'Bilder',g_show:'Seksjoner',g_col:'Farger',
   room_entity:'Romtemperatursensor',outdoor_entity:'Utetemperatursensor',power_entity:'Effektsensor (W)',energy_entity:'Energi i dag-sensor',yesterday_entity:'Energi i går-sensor',yesterday_attribute:'I går-attributt (f.eks. last_period)',total_entity:'Energi totalt-sensor',swing_entity:'Luftretning-select (valgfri)',nanoe_entity:'nanoe / ekstra bryter (valgfri)',
   image:'Bilde (URL eller /local/..., tomt = tegnet enhet)',image_off:'Bilde når av (valgfritt)',
   show_info:'Infofliser',show_unit_temp:'Flis: enhetstemperatur',show_setpoint:'Flis: settpunkt enhet',show_modes:'Modusknapper',show_fan:'Viftehastighet',show_preset:'Forhåndsvalg',show_swing:'Luftretning',show_arrows:'Luftstrøm-piler',
   color_arrow:'Pilfarge (tomt = modusfarge)',color_heat:'Varme',color_cool:'Kjøling',color_dry:'Tørk',color_fan_only:'Vifte',color_auto:'Auto'}
};
class HeatpumpCardEditor extends HTMLElement {
  setConfig(c){ this._cfg=c; this._r(); this._tl(); }
  set hass(h){ this._hass=h; if(this._form){ this._form.hass=h; this._tf&&this._tf.forEach(f=>f.hass=h); this._schema(); } else this._r(); }
  _l(k){ const c=this._cfg&&this._cfg.language; const l=(c&&c!=='auto')?c:((this._hass&&this._hass.language)||'en').slice(0,2); return (HP_ED[l]||HP_ED.en)[k]||HP_ED.en[k]||k; }
  _emit(v){ this._cfg=v; this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:v},bubbles:true,composed:true})); }
  _schema(){
    const cl=this._hass&&this._cfg&&this._cfg.entity&&this._hass.states[this._cfg.entity]; const at=cl?cl.attributes:{};
    const sig=JSON.stringify([at.hvac_modes,at.fan_modes,at.preset_modes,at.swing_modes,this._cfg&&this._cfg.language]); if(sig===this._sig&&this._form.schema) return; this._sig=sig;
    const ent=(name,dom,dc)=>({name,selector:{entity:Object.assign({domain:dom},dc?{device_class:dc}:{})}});
    const txt=name=>({name,selector:{text:{}}}); const bool=name=>({name,default:true,selector:{boolean:{}}});
    const ms=(name,arr)=>({name,selector:{select:{multiple:true,mode:'list',options:(arr||[]).map(String)}}}); const obj=name=>({name,selector:{object:{}}});
    this._form.schema=[
      ent('entity','climate'), txt('name'), {name:'language',selector:{select:{options:['auto','de','no','en'],mode:'dropdown'}}},
      {type:'expandable',name:'',title:this._l('g_ent'),schema:[ent('room_entity','sensor','temperature'),ent('outdoor_entity','sensor','temperature'),ent('power_entity','sensor','power'),ent('energy_entity','sensor','energy'),ent('yesterday_entity','sensor'),txt('yesterday_attribute'),ent('total_entity','sensor','energy'),ent('swing_entity','select'),ent('nanoe_entity','switch')]},
      {type:'expandable',name:'',title:this._l('g_img'),schema:[txt('image'),txt('image_off')]},
      {type:'expandable',name:'',title:this._l('g_show'),schema:['show_info','show_room','show_unit_temp','show_setpoint','show_modes','show_fan','show_preset','show_swing','show_arrows'].map(bool)},
      {type:'expandable',name:'',title:this._l('g_btn'),schema:[ms('modes',at.hvac_modes),obj('mode_labels'),ms('fan_modes',at.fan_modes),obj('fan_labels'),ms('preset_modes',at.preset_modes),obj('preset_labels'),ms('swing_modes',at.swing_modes),obj('swing_labels')]},
      {type:'expandable',name:'',title:this._l('g_col'),schema:['color_arrow','color_heat','color_cool','color_dry','color_fan_only','color_auto'].map(txt)}
    ];
    this._form.computeLabel=s=>this._l(s.name);
  }
  _r(){
    if(!this._hass||!this._cfg) return;
    if(!this._form){ this._form=document.createElement('ha-form');
      this._form.addEventListener('value-changed',e=>{ e.stopPropagation(); const v={}; Object.entries(e.detail.value).forEach(([k,x])=>{ if(x===''||x===undefined||x===null) return; if(Array.isArray(x)&&!x.length) return; if(typeof x==='object'&&!Array.isArray(x)&&!Object.keys(x).length) return; v[k]=x; }); if(this._cfg.tiles) v.tiles=this._cfg.tiles; if(this._cfg.info_columns) v.info_columns=this._cfg.info_columns; this._emit(v); this._form.data=v; });
      this.appendChild(this._form); this._box=document.createElement('div'); this.appendChild(this._box); }
    this._schema(); this._form.hass=this._hass; this._form.data=this._cfg;
  }
  _setTiles(t){ const v=Object.assign({},this._cfg); if(t&&t.length) v.tiles=t; else delete v.tiles; this._emit(v); this._tl(); }
  _tl(){
    if(!this._box||!this._hass) return; const box=this._box; box.innerHTML=''; this._tf=[];
    const tiles=this._cfg.tiles; const c0=this._cfg;
    const st=document.createElement('style'); st.textContent='.tt{margin:16px 0 6px;font-weight:500}.tr{border:1px solid var(--divider-color);border-radius:10px;padding:8px;margin:6px 0}.th{display:flex;gap:6px;align-items:center;margin-bottom:4px}.th b{flex:1;font-size:.9em}.tb{border:1px solid var(--divider-color);background:transparent;color:var(--primary-text-color);border-radius:8px;padding:4px 10px;cursor:pointer;font:inherit}.tbs{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.hint{font-size:.85em;color:var(--secondary-text-color)}'; box.appendChild(st);
    const h=document.createElement('div'); h.className='tt'; h.textContent=this._l('g_tiles'); box.appendChild(h);
    const btn=(txt,fn,parent)=>{ const b=document.createElement('button'); b.className='tb'; b.textContent=txt; b.onclick=fn; parent.appendChild(b); return b; };
    const cols=document.createElement('ha-form'); cols.hass=this._hass; cols.schema=[{name:'info_columns',selector:{number:{min:1,max:6,mode:'box'}}}]; cols.data={info_columns:c0.info_columns}; cols.computeLabel=s=>this._l(s.name);
    cols.addEventListener('value-changed',e=>{ e.stopPropagation(); const v=Object.assign({},this._cfg); if(e.detail.value.info_columns) v.info_columns=e.detail.value.info_columns; else delete v.info_columns; this._emit(v); }); box.appendChild(cols);
    if(!Array.isArray(tiles)){ const p=document.createElement('div'); p.className='hint'; p.textContent=this._l('t_auto'); box.appendChild(p); }
    else tiles.forEach((tl,i)=>{
      const r=document.createElement('div'); r.className='tr'; const hd=document.createElement('div'); hd.className='th'; const sp=['unit_temp','setpoint'].includes(tl.entity);
      const b=document.createElement('b'); b.textContent=(i+1)+'. '+(sp?this._l('t_special_'+tl.entity):(tl.name||tl.entity||'')); hd.appendChild(b);
      btn('↑',()=>{ if(i>0){ const t=tiles.slice(); [t[i-1],t[i]]=[t[i],t[i-1]]; this._setTiles(t);} },hd); btn('↓',()=>{ if(i<tiles.length-1){ const t=tiles.slice(); [t[i+1],t[i]]=[t[i],t[i+1]]; this._setTiles(t);} },hd); btn('✕',()=>{ const t=tiles.slice(); t.splice(i,1); this._setTiles(t.length?t:[]); },hd); r.appendChild(hd);
      const f=document.createElement('ha-form'); f.hass=this._hass;
      f.schema=[].concat(sp?[]:[{name:'entity',selector:{entity:{}}},{name:'attribute',selector:{text:{}}}],[{name:'name',selector:{text:{}}},{name:'icon',selector:{text:{}}},{name:'unit',selector:{text:{}}},{name:'decimals',selector:{number:{min:0,max:4,mode:'box'}}},{name:'span',selector:{number:{min:1,max:4,mode:'box'}}}]);
      f.computeLabel=s=>this._l('t_'+s.name); f.data=tl;
      f.addEventListener('value-changed',e=>{ e.stopPropagation(); const n={}; Object.entries(e.detail.value).forEach(([k,x])=>{ if(x!==''&&x!==undefined&&x!==null) n[k]=x; }); if(sp) n.entity=tl.entity; tiles[i]=n; f.data=n; this._emit(Object.assign({},this._cfg,{tiles:tiles.slice()})); });
      r.appendChild(f); box.appendChild(r); this._tf.push(f);
    });
    const bar=document.createElement('div'); bar.className='tbs';
    const cur=()=>Array.isArray(this._cfg.tiles)?this._cfg.tiles.slice():[];
    btn(this._l('t_add'),()=>this._setTiles(cur().concat([{entity:''}])),bar); btn(this._l('t_unit_temp'),()=>this._setTiles(cur().concat([{entity:'unit_temp'}])),bar); btn(this._l('t_setpoint'),()=>this._setTiles(cur().concat([{entity:'setpoint'}])),bar);
    btn(this._l('t_defaults'),()=>{ const k=document.createElement('heatpump-card'); k._cfg=Object.assign({},this._cfg); delete k._cfg.tiles; k._hass=this._hass; this._setTiles(HeatpumpCard.defaultTiles(k._cfg,k)); },bar);
    if(Array.isArray(tiles)) btn(this._l('t_clear'),()=>this._setTiles(null),bar);
    box.appendChild(bar);
  }
}
customElements.define('heatpump-card-editor', HeatpumpCardEditor);
window.customCards=window.customCards||[];
window.customCards.push({type:'heatpump-card',name:'Heatpump Card',description:'Animated card for air-to-air heat pumps (de/no/en)',preview:false});
console.info('%c HEATPUMP-CARD %c v'+HP_VERSION,'background:#FB8C00;color:#fff','');
