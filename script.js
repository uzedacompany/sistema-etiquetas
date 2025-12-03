/*
  Chaves no localStorage:
   - uzd_etiquetas -> array de { serial, modelo, marca, tag }
   - uzd_logo_global -> dataURL(image)
   - uzd_admin_pass -> string
   - uzd_permissoes -> { alterar_data, alterar_hora, permitir_data_manual }
*/

const KEY_ETI = 'uzd_etiquetas';
const KEY_LOGO = 'uzd_logo_global';
const KEY_PASS = 'uzd_admin_pass';
const KEY_PERM = 'uzd_permissoes';

let etiquetas = JSON.parse(localStorage.getItem(KEY_ETI) || '[]');
let logoGlobal = localStorage.getItem(KEY_LOGO) || null;
let adminPass = localStorage.getItem(KEY_PASS) || '1234';
let permissoes = JSON.parse(localStorage.getItem(KEY_PERM) || JSON.stringify({
  alterar_data: false,
  alterar_hora: false,
  permitir_data_manual: false
}));

// UI refs
const btnUser = document.getElementById('btnUser');
const btnAdmin = document.getElementById('btnAdmin');
const mainUI = document.getElementById('mainUI');
const adminPanel = document.getElementById('adminPanel');
const userPanel = document.getElementById('userPanel');

const adm_tag = document.getElementById('adm_tag');
const adm_serial = document.getElementById('adm_serial');
const adm_modelo = document.getElementById('adm_modelo');
const adm_marca = document.getElementById('adm_marca');
const adm_logo = document.getElementById('adm_logo');
const btnSalvarEtiqueta = document.getElementById('btnSalvarEtiqueta');
const tableWrap = document.getElementById('tableWrap');
const btnExport = document.getElementById('btnExport');
const perm_alterar_data = document.getElementById('perm_alterar_data');
const perm_alterar_hora = document.getElementById('perm_alterar_hora');
const perm_data_manual = document.getElementById('perm_data_manual');
const adm_password = document.getElementById('adm_password');
const btnChangePass = document.getElementById('btnChangePass');
const logoPreview = document.getElementById('logoPreview');
const btnLogoutAdmin = document.getElementById('btnLogoutAdmin');

const btnLogoutUser = document.getElementById('btnLogoutUser');
const user_search = document.getElementById('user_search');
const btnBuscar = document.getElementById('btnBuscar');
const userFound = document.getElementById('userFound');
const u_tag = document.getElementById('u_tag');
const u_modelo = document.getElementById('u_modelo');
const u_marca = document.getElementById('u_marca');
const u_serial = document.getElementById('u_serial');
const u_data = document.getElementById('u_data');
const u_hora = document.getElementById('u_hora');
const u_proxima_select = document.getElementById('u_proxima_select');
const u_proxima_manual = document.getElementById('u_proxima_manual');
const btnGerar = document.getElementById('btnGerar');
const labelPreview = document.getElementById('labelPreview');
const printControls = document.getElementById('printControls');
const btnPrint = document.getElementById('btnPrint');

let editingIndex = -1;

// eventos iniciais
btnUser.addEventListener('click', openAsUser);
btnAdmin.addEventListener('click', promptAdminLogin);
btnLogoutAdmin.addEventListener('click', showStart);
btnLogoutUser.addEventListener('click', showStart);

btnSalvarEtiqueta.addEventListener('click', onSaveEtiqueta);
adm_logo.addEventListener('change', onLogoSelected);
btnExport.addEventListener('click', onExport);

perm_alterar_data.addEventListener('change', onPermChange);
perm_alterar_hora.addEventListener('change', onPermChange);
perm_data_manual.addEventListener('change', onPermChange);
btnChangePass.addEventListener('click', onChangePass);

btnBuscar.addEventListener('click', onBuscar);
u_proxima_select.addEventListener('change', onProximaChange);
btnGerar.addEventListener('click', onGerar);
btnPrint.addEventListener('click', onPrint);

renderStart();

// ------ funções ------

function saveAll(){
  localStorage.setItem(KEY_ETI, JSON.stringify(etiquetas));
  if(logoGlobal) localStorage.setItem(KEY_LOGO, logoGlobal);
  localStorage.setItem(KEY_PASS, adminPass);
  localStorage.setItem(KEY_PERM, JSON.stringify(permissoes));
}

function renderStart(){
  document.querySelector('.card').style.display = 'block';
  mainUI.style.display = 'none';
  adminPanel.style.display = 'none';
  userPanel.style.display = 'none';
}

function showStart(){
  document.querySelector('.card').style.display = 'block';
  mainUI.style.display = 'none';
  adminPanel.style.display = 'none';
  userPanel.style.display = 'none';
}

function promptAdminLogin(){
  const p = prompt('Senha do administrador:');
  if(p === null) return;
  if(p === adminPass){
    openAsAdmin();
  } else alert('Senha incorreta');
}

function openAsAdmin(){
  document.querySelector('.card').style.display='none';
  mainUI.style.display='block';
  adminPanel.style.display='block';
  userPanel.style.display='none';
  loadAdminUI();
}

function openAsUser(){
  document.querySelector('.card').style.display='none';
  mainUI.style.display='block';
  adminPanel.style.display='none';
  userPanel.style.display='block';
  loadUserUI();
}

// ADMIN PANEL
function loadAdminUI(){
  if(logoGlobal){
    logoPreview.innerHTML = `<img src="${logoGlobal}" class="logo-thumb">`;
  } else {
    logoPreview.innerHTML = `<div class="hint">Nenhuma logo global definida</div>`;
  }

  perm_alterar_data.checked = !!permissoes.alterar_data;
  perm_alterar_hora.checked = !!permissoes.alterar_hora;
  perm_data_manual.checked = !!permissoes.permitir_data_manual;

  renderTable();
}

function onLogoSelected(e){
  const f = e.target.files[0];
  if(!f) return;
  const fr = new FileReader();
  fr.onload = () => {
    logoGlobal = fr.result;
    saveAll();
    loadAdminUI();
  };
  fr.readAsDataURL(f);
}

function onSaveEtiqueta(){
  const tag = adm_tag.value.trim();
  const serial = adm_serial.value.trim();
  const modelo = adm_modelo.value.trim();
  const marca = adm_marca.value.trim();

  if(!serial){
    alert('Número de série é obrigatório');
    return;
  }

  const exists = etiquetas.findIndex(x => x.serial === serial);

  if(exists >= 0){
    if(!confirm('Número de série já existe. Deseja atualizar?')) return;
    etiquetas[exists].modelo = modelo;
    etiquetas[exists].marca = marca;
    etiquetas[exists].tag = tag;
  } else {
    etiquetas.push({ serial, modelo, marca, tag });
  }

  adm_tag.value='';
  adm_serial.value='';
  adm_modelo.value='';
  adm_marca.value='';

  saveAll();
  renderTable();
  alert('Etiqueta salva.');
}

function renderTable(){
  if(etiquetas.length === 0){
    tableWrap.innerHTML = '<div class="hint">Nenhuma etiqueta cadastrada</div>';
    return;
  }

  const rows = etiquetas.map((e,i)=>`
    <tr>
      <td>${e.tag||''}</td>
      <td>${e.serial}</td>
      <td>${e.modelo||''}</td>
      <td>${e.marca||''}</td>
      <td>
        <button data-i="${i}" class="editBtn btn-ghost">Editar</button>
        <button data-i="${i}" class="delBtn btn-ghost">Apagar</button>
      </td>
    </tr>
  `).join('');

  tableWrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Tag</th>
          <th>Série</th>
          <th>Modelo</th>
          <th>Marca</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  tableWrap.querySelectorAll('.editBtn').forEach(b => b.addEventListener('click', onEditLabel));
  tableWrap.querySelectorAll('.delBtn').forEach(b => b.addEventListener('click', onDelLabel));
}

function onEditLabel(e){
  const i = +e.target.dataset.i;
  const item = etiquetas[i];
  adm_tag.value = item.tag || '';
  adm_serial.value = item.serial;
  adm_modelo.value = item.modelo;
  adm_marca.value = item.marca;
  editingIndex = i;
}

function onDelLabel(e){
  const i = +e.target.dataset.i;
  if(confirm('Deseja apagar essa etiqueta?')){
    etiquetas.splice(i,1);
    saveAll();
    renderTable();
  }
}

function onExport(){
  const hdr = 'tag,serial,modelo,marca\n';
  const lines = etiquetas.map(e=>
    [e.tag||'',e.serial||'',e.modelo||'',e.marca||'']
    .map(s=>'"'+String(s).replace(/"/g,'""')+'"').join(',')
  );
  const csv = hdr + lines.join('\n');
  const blob = new Blob([csv],{type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'etiquetas.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// permissões
function onPermChange(){
  permissoes.alterar_data = perm_alterar_data.checked;
  permissoes.alterar_hora = perm_alterar_hora.checked;
  permissoes.permitir_data_manual = perm_data_manual.checked;
  saveAll();
  loadUserUI();
  alert('Permissões atualizadas');
}

function onChangePass(){
  const np = adm_password.value.trim();
  if(!np){
    alert('Digite nova senha');
    return;
  }
  adminPass = np;
  adm_password.value='';
  saveAll();
  alert('Senha alterada');
}

// USER PANEL
function loadUserUI(){
  const now = new Date();
  u_data.value = now.toISOString().slice(0,10);
  u_hora.value = now.toTimeString().slice(0,5);

  u_data.disabled = !permissoes.alterar_data;
  u_hora.disabled = !permissoes.alterar_hora;

  const manualOpt = Array.from(u_proxima_select.options).find(o=>o.value==='manual');

  if(!permissoes.permitir_data_manual){
    if(manualOpt) manualOpt.style.display = 'none';
  } else {
    if(manualOpt) manualOpt.style.display = 'block';
  }

  u_proxima_manual.style.display = 'none';
  userFound.style.display = 'none';
}

function onBuscar(){
  const sn = user_search.value.trim();
  if(!sn){
    alert('Digite o número de série');
    return;
  }

  const item = etiquetas.find(l => l.serial === sn);

  if(!item){
    alert('Número de série não encontrado');
    return;
  }

  userFound.style.display='block';

  u_tag.innerText = item.tag || '-';
  u_modelo.innerText = item.modelo || '-';
  u_marca.innerText = item.marca || '-';
  u_serial.innerText = item.serial;

  const now = new Date();
  u_data.value = now.toISOString().slice(0,10);
  u_hora.value = now.toTimeString().slice(0,5);

  u_data.disabled = !permissoes.alterar_data;
  u_hora.disabled = !permissoes.alterar_hora;

  const manualOpt = Array.from(u_proxima_select.options).find(o=>o.value==='manual');
  if(!permissoes.permitir_data_manual){
    if(manualOpt) manualOpt.style.display='none';
    if(u_proxima_select.value === 'manual') u_proxima_select.value='90d';
  } else {
    if(manualOpt) manualOpt.style.display='block';
  }

  u_proxima_manual.style.display = 'none';
  printControls.style.display = 'none';
  labelPreview.innerHTML='';
}

function onProximaChange(){
  if(u_proxima_select.value === 'manual'){
    if(!permissoes.permitir_data_manual){
      alert('Opção manual não permitida pelo administrador');
      u_proxima_select.value = '90d';
      return;
    }
    u_proxima_manual.style.display = 'block';
  } else {
    u_proxima_manual.style.display = 'none';
  }
}

// datas
function addDays(dateStr, days){
  const d = new Date(dateStr);
  d.setDate(d.getDate()+days);
  return d;
}
function addMonths(dateStr, months){
  const d = new Date(dateStr);
  d.setMonth(d.getMonth()+months);
  return d;
}
function addYears(dateStr, years){
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear()+years);
  return d;
}

function onGerar(){
  const sn = user_search.value.trim();
  if(!sn){
    alert('Digite o número de série');
    return;
  }

  const item = etiquetas.find(l => l.serial === sn);
  if(!item){
    alert('Série não encontrada');
    return;
  }

  const data = u_data.value;
  const hora = u_hora.value;

  let proximaDate = null;

  if(u_proxima_select.value === '90d'){
    proximaDate = addDays(data,90);
  } else if(u_proxima_select.value === '6m'){
    proximaDate = addMonths(data,6);
  } else if(u_proxima_select.value === '1y'){
    proximaDate = addYears(data,1);
  } else if(u_proxima_select.value === 'manual'){
    if(!permissoes.permitir_data_manual){
      alert('Manual não permitido');
      return;
    }
    if(!u_proxima_manual.value){
      alert('Escolha a data manual');
      return;
    }
    proximaDate = new Date(u_proxima_manual.value);
  } else {
    proximaDate = addDays(data,90);
  }

  const previewDiv = document.createElement('div');
  previewDiv.id = 'printArea';

  const label = document.createElement('div');
  label.className = 'label';

  const logoBox = document.createElement('div');
  logoBox.className = 'logo';

  if(logoGlobal){
    const img = document.createElement('img');
    img.src = logoGlobal;
    logoBox.appendChild(img);
  } else {
    logoBox.innerText = 'Logo';
    logoBox.style.fontSize='12px';
    logoBox.style.fontWeight='700';
  }

  label.appendChild(logoBox);

  const body = document.createElement('div');
  body.className='body';

  const fMarca = document.createElement('div');
  fMarca.className='field-row';
  fMarca.innerHTML = `<div class="title">Marca:</div><div class="value">${item.marca}</div>`;

  const fModelo = document.createElement('div');
  fModelo.className='field-row';
  fModelo.innerHTML = `<div class="title">Modelo:</div><div class="value">${item.modelo}</div>`;

  const fSerie = document.createElement('div');
  fSerie.className='field-row';
  fSerie.innerHTML = `<div class="title">Série:</div><div class="value">${item.serial}</div>`;

  const fTag = document.createElement('div');
  fTag.className='field-row';
  fTag.innerHTML = `<div class="title">Tag:</div><div class="value">${item.tag||''}</div>`;

  body.appendChild(fMarca);
  body.appendChild(fModelo);
  body.appendChild(fSerie);
  body.appendChild(fTag);

  const bigData = document.createElement('div');
  bigData.className='dates';
  bigData.innerText = 'Data Realizada: ' + (data || '');

  const bigNext = document.createElement('div');
  bigNext.className='dates';
  bigNext.innerText = 'Próxima Data: ' + (proximaDate ? proximaDate.toISOString().slice(0,10) : '');

  body.appendChild(bigData);
  body.appendChild(bigNext);

  label.appendChild(body);
  previewDiv.appendChild(label);

  labelPreview.innerHTML='';
  labelPreview.appendChild(previewDiv);

  printControls.style.display='block';
}

function onPrint(){
  window.print();
}

// inicial
function init(){
  // nada adicional
}
init();
