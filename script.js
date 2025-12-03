// script.js - módulo (usa Firebase modular v9+ via CDN imports)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ====== COLE AQUI SUA CONFIG DO FIREBASE ======
// Vá no Console Firebase > Configurações do projeto > Seus apps (web) > copiar config
const firebaseConfig = {
  apiKey: "AIzaSyB5F-QZrwe49BgH7wu9XpSiHPMgZRqMtfc",
  authDomain: "sistema-etiquetas.firebaseapp.com",
  projectId: "sistema-etiquetas",
  storageBucket: "sistema-etiquetas.firebasestorage.app",
  messagingSenderId: "655215279342",
  appId: "1:655215279342:web:9d2cdf0f11d1c3338387ff",
  measurementId: "G-0DJW6MFHP9"
};
// ================================================

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- keys/coleções ---
const CONFIG_DOC = doc(db, 'config', 'global'); // onde guardamos adminPass, logo, permissoes
const ETI_COLLECTION = 'etiquetas';

// --- UI refs ---
const btnUser = document.getElementById('btnUser');
const btnAdmin = document.getElementById('btnAdmin');
const mainUI = document.getElementById('mainUI');
const adminPanel = document.getElementById('adminPanel');
const userPanel = document.getElementById('userPanel');
const startCard = document.getElementById('startCard');

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

let configCache = null; // guarda config carregada
let etiquetasCache = []; // array local para mostrar tabela

// eventos
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

// inicial
renderStart();
loadConfigAndData(); // carrega config / tabela do firestore

// ---------- Funções ----------

function renderStart(){
  startCard.style.display = 'block';
  mainUI.style.display = 'none';
  adminPanel.style.display = 'none';
  userPanel.style.display = 'none';
}

function showStart(){
  startCard.style.display = 'block';
  mainUI.style.display = 'none';
  adminPanel.style.display = 'none';
  userPanel.style.display = 'none';
}

async function loadConfigAndData(){
  // tenta ler doc config/global, se não existir cria com defaults
  try {
    const snap = await getDoc(CONFIG_DOC);
    if(!snap.exists()){
      const defaultCfg = {
        adminPass: '1234',
        logo: null, // dataURL
        permissoes: { alterar_data: false, alterar_hora: false, permitir_data_manual: false }
      };
      await setDoc(CONFIG_DOC, defaultCfg);
      configCache = defaultCfg;
    } else {
      configCache = snap.data();
    }
  } catch(err){
    alert('Erro ao carregar config: ' + err.message);
    console.error(err);
    configCache = { adminPass:'1234', logo:null, permissoes:{alterar_data:false,alterar_hora:false,permitir_data_manual:false} };
  }
  await loadEtiquetasTable();
}

async function loadEtiquetasTable(){
  // busca todas etiquetas
  try {
    const qSnap = await getDocs(collection(db, ETI_COLLECTION));
    etiquetasCache = [];
    qSnap.forEach(d=> etiquetasCache.push(d.data()));
    renderTable();
  } catch(err){
    console.error('Erro carregar etiquetas', err);
    etiquetasCache = [];
    renderTable();
  }
}

// ---------- ADMIN / LOGIN ----------
function promptAdminLogin(){
  const p = prompt('Senha do administrador:');
  if(p === null) return;
  // comparar com configCache.adminPass (se ainda não carregou, aguardar)
  if(!configCache){ setTimeout(()=> promptAdminLogin(), 300); return; }
  if(p === configCache.adminPass){
    openAsAdmin();
  } else {
    alert('Senha incorreta');
  }
}

function openAsAdmin(){
  startCard.style.display='none';
  mainUI.style.display='block';
  adminPanel.style.display='block';
  userPanel.style.display='none';
  loadAdminUI();
}

function openAsUser(){
  startCard.style.display='none';
  mainUI.style.display='block';
  adminPanel.style.display='none';
  userPanel.style.display='block';
  loadUserUI();
}

function loadAdminUI(){
  // preview logo
  if(configCache && configCache.logo){
    logoPreview.innerHTML = `<img src="${configCache.logo}" class="logo-thumb">`;
  } else logoPreview.innerHTML = `<div class="hint">Nenhuma logo global definida</div>`;
  // permissões
  perm_alterar_data.checked = !!(configCache && configCache.permissoes && configCache.permissoes.alterar_data);
  perm_alterar_hora.checked = !!(configCache && configCache.permissoes && configCache.permissoes.alterar_hora);
  perm_data_manual.checked = !!(configCache && configCache.permissoes && configCache.permissoes.permitir_data_manual);
  renderTable();
}

async function onLogoSelected(e){
  const f = e.target.files[0];
  if(!f) return;
  const fr = new FileReader();
  fr.onload = async ()=> {
    const dataUrl = fr.result;
    // salva no config global
    try {
      await setDoc(CONFIG_DOC, { ...configCache, logo: dataUrl }, { merge: true });
      configCache.logo = dataUrl;
      loadAdminUI();
      alert('Logo global salva.');
    } catch(err){
      console.error(err); alert('Erro ao salvar logo: ' + err.message);
    }
  };
  fr.readAsDataURL(f);
}

async function onSaveEtiqueta(){
  const tag = adm_tag.value.trim();
  const serial = adm_serial.value.trim();
  const modelo = adm_modelo.value.trim();
  const marca = adm_marca.value.trim();
  if(!serial){ alert('Número de série é obrigatório'); return; }
  const data = { serial, modelo, marca, tag };
  try {
    await setDoc(doc(db, ETI_COLLECTION, serial), data);
    adm_tag.value=''; adm_serial.value=''; adm_modelo.value=''; adm_marca.value='';
    await loadEtiquetasTable();
    alert('Etiqueta salva.');
  } catch(err){
    console.error(err); alert('Erro ao salvar etiqueta: ' + err.message);
  }
}

function renderTable(){
  if(!etiquetasCache || etiquetasCache.length === 0){
    tableWrap.innerHTML = '<div class="hint">Nenhuma etiqueta cadastrada</div>';
    return;
  }
  const rows = etiquetasCache.map((e,i)=>`
    <tr>
      <td>${e.tag||''}</td>
      <td>${e.serial}</td>
      <td>${e.modelo||''}</td>
      <td>${e.marca||''}</td>
      <td>
        <button data-serial="${e.serial}" class="editBtn btn-ghost">Editar</button>
        <button data-serial="${e.serial}" class="delBtn btn-ghost">Apagar</button>
      </td>
    </tr>
  `).join('');
  tableWrap.innerHTML = `<table><thead><tr><th>Tag</th><th>Série</th><th>Modelo</th><th>Marca</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table>`;
  tableWrap.querySelectorAll('.editBtn').forEach(b=>b.addEventListener('click', onEditLabel));
  tableWrap.querySelectorAll('.delBtn').forEach(b=>b.addEventListener('click', onDelLabel));
}

function onEditLabel(e){
  const serial = e.target.dataset.serial;
  const item = etiquetasCache.find(x=>x.serial === serial);
  if(!item) return;
  adm_tag.value = item.tag || '';
  adm_serial.value = item.serial;
  adm_modelo.value = item.modelo;
  adm_marca.value = item.marca;
}

async function onDelLabel(e){
  const serial = e.target.dataset.serial;
  if(!confirm('Deseja apagar essa etiqueta?')) return;
  try {
    await deleteDoc(doc(db, ETI_COLLECTION, serial));
    await loadEtiquetasTable();
  } catch(err){
    console.error(err); alert('Erro ao apagar: ' + err.message);
  }
}

function onExport(){
  const hdr = 'tag,serial,modelo,marca\n';
  const lines = (etiquetasCache||[]).map(e=>[e.tag||'',e.serial||'',e.modelo||'',e.marca||''].map(s=>'"'+String(s).replace(/"/g,'""')+'"').join(','));
  const csv = hdr + lines.join('\n');
  const blob = new Blob([csv],{type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'etiquetas.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

// permissões
async function onPermChange(){
  const novo = {
    ...configCache,
    permissoes: {
      alterar_data: perm_alterar_data.checked,
      alterar_hora: perm_alterar_hora.checked,
      permitir_data_manual: perm_data_manual.checked
    }
  };
  try {
    await setDoc(CONFIG_DOC, novo, { merge: true });
    configCache = novo;
    loadAdminUI();
    alert('Permissões atualizadas');
  } catch(err){
    console.error(err); alert('Erro ao salvar permissões: ' + err.message);
  }
}

async function onChangePass(){
  const np = adm_password.value.trim();
  if(!np){ alert('Digite nova senha'); return; }
  try {
    await setDoc(CONFIG_DOC, { ...configCache, adminPass: np }, { merge: true });
    configCache.adminPass = np;
    adm_password.value='';
    alert('Senha alterada');
  } catch(err){
    console.error(err); alert('Erro ao alterar senha: ' + err.message);
  }
}

// USER UI
function loadUserUI(){
  const now = new Date();
  u_data.value = now.toISOString().slice(0,10);
  u_hora.value = now.toTimeString().slice(0,5);
  // aplicar permissões
  const perm = configCache && configCache.permissoes ? configCache.permissoes : { alterar_data:false, alterar_hora:false, permitir_data_manual:false };
  u_data.disabled = !perm.alterar_data;
  u_hora.disabled = !perm.alterar_hora;
  const manualOpt = Array.from(u_proxima_select.options).find(o=>o.value==='manual');
  if(!perm.permitir_data_manual){ if(manualOpt) manualOpt.style.display = 'none'; } else { if(manualOpt) manualOpt.style.display = 'block'; }
  u_proxima_manual.style.display = 'none';
  userFound.style.display='none';
  printControls.style.display='none';
}

function onBuscar(){
  const sn = user_search.value.trim();
  if(!sn){ alert('Digite o número de série'); return; }
  const item = etiquetasCache.find(l=>l.serial === sn);
  if(!item){ alert('Número de série não encontrado'); return; }
  userFound.style.display='block';
  u_tag.innerText = item.tag || '-';
  u_modelo.innerText = item.modelo || '-';
  u_marca.innerText = item.marca || '-';
  u_serial.innerText = item.serial;
  const now = new Date();
  u_data.value = now.toISOString().slice(0,10);
  u_hora.value = now.toTimeString().slice(0,5);
  const perm = configCache && configCache.permissoes ? configCache.permissoes : { alterar_data:false, alterar_hora:false, permitir_data_manual:false };
  u_data.disabled = !perm.alterar_data;
  u_hora.disabled = !perm.alterar_hora;
  const manualOpt = Array.from(u_proxima_select.options).find(o=>o.value==='manual');
  if(!perm.permitir_data_manual){ if(manualOpt) manualOpt.style.display='none'; if(u_proxima_select.value==='manual') u_proxima_select.value='90d'; }
  else if(manualOpt) manualOpt.style.display='block';
  u_proxima_manual.style.display = 'none';
  printControls.style.display='none';
  labelPreview.innerHTML='';
}

function onProximaChange(){
  if(u_proxima_select.value === 'manual'){
    if(!configCache || !configCache.permissoes || !configCache.permissoes.permitir_data_manual){ alert('Opção manual não permitida pelo administrador'); u_proxima_select.value='90d'; return; }
    u_proxima_manual.style.display='block';
  } else {
    u_proxima_manual.style.display='none';
  }
}

function addDays(dateStr, days){ const d=new Date(dateStr); d.setDate(d.getDate()+days); return d; }
function addMonths(dateStr, months){ const d=new Date(dateStr); d.setMonth(d.getMonth()+months); return d; }
function addYears(dateStr, years){ const d=new Date(dateStr); d.setFullYear(d.getFullYear()+years); return d; }

function formatISODate(d){ return d.toISOString().slice(0,10); }

function onGerar(){
  const sn = user_search.value.trim(); if(!sn){ alert('Digite o número de série'); return; }
  const item = etiquetasCache.find(l=>l.serial === sn);
  if(!item){ alert('Série não encontrada'); return; }
  const data = u_data.value; const hora = u_hora.value;
  let proximaDate = null;
  if(u_proxima_select.value === '90d'){ proximaDate = addDays(data,90); }
  else if(u_proxima_select.value === '6m'){ proximaDate = addMonths(data,6); }
  else if(u_proxima_select.value === '1y'){ proximaDate = addYears(data,1); }
  else if(u_proxima_select.value === 'manual'){
    if(!configCache || !configCache.permissoes || !configCache.permissoes.permitir_data_manual){ alert('Manual não permitido'); return; }
    if(!u_proxima_manual.value){ alert('Escolha a data manual'); return; }
    proximaDate = new Date(u_proxima_manual.value);
  } else { proximaDate = addDays(data,90); }

  // montar etiqueta (uma única, dentro de printArea)
  const previewDiv = document.createElement('div');
  previewDiv.id = 'printArea';
  previewDiv.style.width = '60mm';
  previewDiv.style.height = '40mm';
  previewDiv.style.boxSizing = 'border-box';

  const label = document.createElement('div'); label.className='label';

  // logo
  const logoBox = document.createElement('div'); logoBox.className='logo';
  if(configCache && configCache.logo){
    const img = document.createElement('img'); img.src = configCache.logo; logoBox.appendChild(img);
  } else { logoBox.innerText = 'Logo'; logoBox.style.fontSize='12px'; logoBox.style.fontWeight='700'; }
  label.appendChild(logoBox);

  // body com caixas
  const body = document.createElement('div'); body.className='body';

  const boxMarca = document.createElement('div'); boxMarca.className='info-box';
  boxMarca.innerHTML = `<div class="title">Marca</div><div class="value">${item.marca}</div>`;

  const boxModelo = document.createElement('div'); boxModelo.className='info-box';
  boxModelo.innerHTML = `<div class="title">Modelo</div><div class="value">${item.modelo}</div>`;

  const boxSerie = document.createElement('div'); boxSerie.className='info-box';
  boxSerie.innerHTML = `<div class="title">Série</div><div class="value">${item.serial}</div>`;

  const boxTag = document.createElement('div'); boxTag.className='info-box';
  boxTag.innerHTML = `<div class="title">Tag</div><div class="value">${item.tag||''}</div>`;

  body.appendChild(boxMarca);
  body.appendChild(boxModelo);
  body.appendChild(boxSerie);
  body.appendChild(boxTag);

  const boxData = document.createElement('div'); boxData.className='dates-box';
  boxData.innerHTML = `<div>Realizada: ${data}</div><div>Hora: ${hora || ''}</div>`;
  body.appendChild(boxData);

  const boxProx = document.createElement('div'); boxProx.className='dates-box';
  boxProx.innerHTML = `<div>Próxima: ${proximaDate ? formatISODate(proximaDate) : ''}</div>`;
  body.appendChild(boxProx);

  label.appendChild(body);
  previewDiv.appendChild(label);

  labelPreview.innerHTML = '';
  labelPreview.appendChild(previewDiv);

  printControls.style.display='block';
}

// imprimir só a etiqueta
function onPrint(){
  // abrir diálogo de impressão; CSS @media print já ajusta para imprimir #printArea apenas
  window.print();
}
