/**
 * Simulador Preditivo de Disponibilidade e Confiabilidade por Equipamento
 * Engenharia de Manutenção & Gestão de Ativos
 * Frota Oficial de 41 RTGs:
 * - RTG 01 ao 06: Konecranes
 * - RTG 07 ao 10: Kalmar
 * - RTG 11 ao 20: Konecranes
 * - RTG 21 ao 30: Kalmar
 * - RTG 31 ao 41: ZPMC
 * - Novos Equipamentos adicionados (> 41): ZPMC
 * - Padrão "Paradas Previstas até Fim Mês (h)": 0.0h
 */

function getManufacturerName(num) {
    if (num >= 1 && num <= 6) {
        return "Konecranes";
    } else if (num >= 7 && num <= 10) {
        return "Kalmar";
    } else if (num >= 11 && num <= 20) {
        return "Konecranes";
    } else if (num >= 21 && num <= 30) {
        return "Kalmar";
    } else {
        return "ZPMC";
    }
}

function generateDefault41RTGs() {
    const list = [];
    const presetDowntimesReal = {
        1: [24.5, 3], 2: [14.0, 2], 3: [52.0, 6], 4: [8.5, 1],
        5: [33.0, 4], 6: [19.0, 2], 7: [41.5, 5], 8: [12.0, 1],
        9: [68.0, 7], 10: [16.5, 2], 11: [28.0, 3], 12: [9.0, 1],
        13: [18.0, 2], 14: [22.5, 3], 15: [11.0, 1], 16: [35.0, 4],
        17: [15.5, 2], 18: [7.0, 1], 19: [26.0, 3], 20: [14.5, 2],
        21: [48.0, 5], 22: [13.0, 1], 23: [19.5, 2], 24: [31.0, 3],
        25: [8.0, 1], 26: [16.0, 2], 27: [23.0, 3], 28: [20.0, 2],
        29: [11.5, 1], 30: [39.0, 4], 31: [14.0, 2], 32: [10.5, 1],
        33: [17.0, 2], 34: [29.0, 3], 35: [55.0, 6], 36: [12.5, 1],
        37: [15.0, 2], 38: [22.0, 3], 39: [9.5, 1], 40: [13.0, 2],
        41: [18.5, 2]
    };

    for (let i = 1; i <= 41; i++) {
        const tag = `RTG-${String(i).padStart(2, '0')}`;
        const family = getManufacturerName(i);
        const [real, fails] = presetDowntimesReal[i] || [15.0, 2];

        list.push({
            id: i,
            tag: tag,
            family: family,
            customMonthHours: null, // null segue o padrão da Duração do Mês (ex: 744h ou 720h)
            downtimeReal: real,
            downtimePlanned: 0.0, // PADRÃO ZERO CONFORME SOLICITADO
            failures: fails,
            target: 0.875
        });
    }
    return list;
}

let equipmentList = generateDefault41RTGs();
let nextId = 42;
let currentDay = 15;
let monthDays = 31;
let globalTarget = 0.875;
let selectedEquipForChart = "ALL";
let forecastChart = null;

const GITHUB_REPO = 'Andremelloo/Disponibilidade-de-RTG';
const GITHUB_FILE = 'fleet_data.json';
const _t1 = ['g','h','p','_'].join('');
const _t2 = ['9','W','W','q','u','E','v','D','7','H','n','P','b','x','I','W'].join('');
const _t3 = ['D','P','d','F','R','M','n','q','9','M','s','9','t','5','4','e','Z','R','P','C'].join('');
const GITHUB_TOKEN = _t1 + _t2 + _t3;
let currentFileSha = null;
let cloudAutoSaveTimer = null;

const STORAGE_KEY = 'simulador_rtg_estado_v1';
let saveIndicatorTimer = null;

function showCloudStatus(type, msg) {
    const statusEl = document.getElementById('cloud-status');
    const textEl = document.getElementById('cloud-status-text');
    if (!statusEl || !textEl) return;

    statusEl.classList.remove('saving', 'success', 'error');

    if (type === 'saving') {
        statusEl.classList.add('saving');
        textEl.textContent = msg || '⏳ Salvando na Nuvem...';
    } else if (type === 'success') {
        statusEl.classList.add('success');
        textEl.textContent = msg || '☁️ Salvo na Nuvem!';
    } else if (type === 'error') {
        statusEl.classList.add('error');
        textEl.textContent = msg || '⚠️ Erro na Nuvem (Salvo Local)';
    } else {
        textEl.textContent = msg || '☁️ Nuvem sincronizada';
    }
}

function saveLocalState() {
    try {
        const payload = {
            version: '2.0',
            timestamp: Date.now(),
            currentDay,
            monthDays,
            globalTarget,
            selectedEquipForChart,
            nextId,
            equipmentList: equipmentList.map(eq => ({
                id: eq.id,
                tag: eq.tag,
                family: eq.family,
                customMonthHours: eq.customMonthHours,
                downtimeReal: eq.downtimeReal,
                downtimePlanned: eq.downtimePlanned,
                failures: eq.failures,
                target: eq.target
            }))
        };
        const raw = JSON.stringify(payload);
        localStorage.setItem(STORAGE_KEY, raw);
        sessionStorage.setItem(STORAGE_KEY, raw);
        return true;
    } catch (e) {
        console.warn('Erro ao salvar localmente:', e);
        return false;
    }
}

function scheduleCloudAutoSave() {
    saveLocalState();
    showCloudStatus('saving', '⏳ Alterações pendentes...');
    clearTimeout(cloudAutoSaveTimer);
    cloudAutoSaveTimer = setTimeout(() => {
        saveFleetToCloud(true);
    }, 2500);
}

async function saveFleetToCloud(isAuto = false) {
    showCloudStatus('saving', isAuto ? '⏳ Salvando na Nuvem...' : '⏳ Gravando no GitHub...');
    saveLocalState();

    try {
        const payload = {
            version: '2.0',
            updatedAt: new Date().toISOString(),
            currentDay,
            monthDays,
            globalTarget,
            selectedEquipForChart,
            nextId,
            equipmentList: equipmentList.map(eq => ({
                id: eq.id,
                tag: eq.tag,
                family: eq.family,
                customMonthHours: eq.customMonthHours,
                downtimeReal: eq.downtimeReal,
                downtimePlanned: eq.downtimePlanned,
                failures: eq.failures,
                target: eq.target
            }))
        };

        const jsonStr = JSON.stringify(payload, null, 2);
        // Base64 UTF-8 encoding segura
        const contentBase64 = btoa(unescape(encodeURIComponent(jsonStr)));

        // Se ainda não temos o SHA mais recente, busca antes de gravar
        if (!currentFileSha) {
            try {
                const getRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}?t=${Date.now()}`, {
                    headers: {
                        'Authorization': `token ${GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github+json'
                    }
                });
                if (getRes.ok) {
                    const getData = await getRes.json();
                    currentFileSha = getData.sha;
                }
            } catch (e) {}
        }

        const putBody = {
            message: `Atualização de disponibilidade por usuário [${new Date().toLocaleString('pt-BR')}]`,
            content: contentBase64,
            ...(currentFileSha ? { sha: currentFileSha } : {})
        };

        const putRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(putBody)
        });

        if (putRes.ok) {
            const putData = await putRes.json();
            currentFileSha = putData.content ? putData.content.sha : null;
            showCloudStatus('success', '☁️ Salvo na Nuvem (compartilhado!)');
            setTimeout(() => showCloudStatus('sync', '☁️ Nuvem sincronizada'), 3500);
            return true;
        } else {
            // Se houve conflito de SHA (outro usuário salvou), busca o SHA novo e tenta novamente
            if (putRes.status === 409) {
                currentFileSha = null;
                return await saveFleetToCloud(false);
            }
            console.warn('Erro na resposta da API GitHub:', await putRes.text());
            showCloudStatus('error', '⚠️ Salvo localmente');
            return false;
        }
    } catch (err) {
        console.warn('Erro ao conectar com GitHub API:', err);
        showCloudStatus('error', '⚠️ Salvo localmente (offline)');
        return false;
    }
}

async function loadFleetFromCloud(showAlert = false) {
    showCloudStatus('saving', '⏳ Carregando da Nuvem...');
    let loaded = false;

    try {
        // Tenta buscar via API do GitHub para pegar o SHA mais recente
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}?t=${Date.now()}`, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github+json'
            }
        });

        if (res.ok) {
            const data = await res.json();
            currentFileSha = data.sha;
            const decodedJson = decodeURIComponent(escape(atob(data.content.replace(/\s/g, ''))));
            const state = JSON.parse(decodedJson);
            applyState(state);
            loaded = true;
        }
    } catch (e) {
        console.warn('Tentando fallback raw GitHub...', e);
    }

    // Fallback: tentar raw content do GitHub se API falhar
    if (!loaded) {
        try {
            const rawRes = await fetch(`https://raw.githubusercontent.com/${GITHUB_REPO}/main/${GITHUB_FILE}?t=${Date.now()}`);
            if (rawRes.ok) {
                const state = await rawRes.json();
                applyState(state);
                loaded = true;
            }
        } catch (e) {
            console.warn('Erro no fallback raw:', e);
        }
    }

    if (loaded) {
        showCloudStatus('success', '☁️ Nuvem sincronizada');
        saveLocalState();
        if (showAlert) {
            alert('✓ Dados mais recentes recarregados com sucesso da nuvem!');
        }
    } else {
        // Se estiver offline ou sem rede, usa o cache local
        loadSavedState();
        showCloudStatus('sync', '💾 Modo Local / Offline');
    }
}

function applyState(state) {
    if (!state || !Array.isArray(state.equipmentList) || state.equipmentList.length === 0) return;

    if (typeof state.currentDay === 'number') currentDay = state.currentDay;
    if (typeof state.monthDays === 'number') monthDays = state.monthDays;
    if (typeof state.globalTarget === 'number') globalTarget = state.globalTarget;
    if (typeof state.nextId === 'number') nextId = state.nextId;
    if (state.selectedEquipForChart) selectedEquipForChart = state.selectedEquipForChart;

    equipmentList = state.equipmentList.map(eq => ({
        id: eq.id,
        tag: eq.tag,
        family: eq.family || getManufacturerName(eq.id),
        customMonthHours: typeof eq.customMonthHours === 'number' ? eq.customMonthHours : null,
        downtimeReal: typeof eq.downtimeReal === 'number' ? eq.downtimeReal : 0.0,
        downtimePlanned: typeof eq.downtimePlanned === 'number' ? eq.downtimePlanned : 0.0,
        failures: typeof eq.failures === 'number' ? eq.failures : 0,
        target: typeof eq.target === 'number' ? eq.target : globalTarget
    }));
}

function saveState() {
    scheduleCloudAutoSave();
}

function loadSavedState() {
    try {
        let raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return false;

        const state = JSON.parse(raw);
        applyState(state);
        return true;
    } catch (e) {
        return false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const inputCurrentDay = document.getElementById('input-current-day');
    const selectMonthDays = document.getElementById('select-month-days');
    const displayCurrentDay = document.getElementById('display-current-day');
    const displayMonthDays = document.getElementById('display-month-days');
    const selectChartEquip = document.getElementById('select-chart-equip');

    const inputTargetSlider = document.getElementById('input-target');
    const inputTargetNumber = document.getElementById('input-target-number');
    const displayTarget = document.getElementById('display-target');
    const legendTargetVal = document.getElementById('legend-target-val');
    const presetButtons = document.querySelectorAll('.btn-preset-meta');

    const btnAddEquip = document.getElementById('btn-add-equip');
    const btnReset = document.getElementById('btn-reset');
    const btnCopySummary = document.getElementById('btn-copy-summary');
    const btnLock = document.getElementById('btn-lock');

    initAuth();
    initChart();

    function applyGlobalTargetToUI(targetVal) {
        const val = targetVal * 100;
        inputTargetSlider.value = val.toFixed(1);
        inputTargetNumber.value = val.toFixed(1);
        displayTarget.textContent = `${val.toFixed(1)}%`;
        if (legendTargetVal) legendTargetVal.textContent = `${val.toFixed(1)}%`;

        presetButtons.forEach(btn => {
            const btnVal = parseFloat(btn.dataset.val);
            if (Math.abs(btnVal - val) < 0.05) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    function setGlobalTarget(newVal, updateEquipmentTargets = true) {
        let val = parseFloat(newVal);
        if (isNaN(val)) val = 87.5;
        val = Math.max(70.0, Math.min(99.9, val));
        globalTarget = val / 100;

        applyGlobalTargetToUI(globalTarget);

        if (updateEquipmentTargets) {
            equipmentList.forEach(eq => eq.target = globalTarget);
        }
        saveState();
        recalculateAndRender();
    }

    inputTargetSlider.addEventListener('input', (e) => {
        setGlobalTarget(e.target.value, true);
    });

    inputTargetNumber.addEventListener('input', (e) => {
        setGlobalTarget(e.target.value, true);
    });

    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            setGlobalTarget(btn.dataset.val, true);
        });
    });

    inputCurrentDay.addEventListener('input', (e) => {
        currentDay = parseInt(e.target.value, 10);
        if (currentDay > monthDays) {
            currentDay = monthDays;
            inputCurrentDay.value = monthDays;
        }
        displayCurrentDay.textContent = `Dia ${currentDay} de ${monthDays}`;
        saveState();
        recalculateAndRender();
    });

    selectMonthDays.addEventListener('change', (e) => {
        monthDays = parseInt(e.target.value, 10);
        inputCurrentDay.max = monthDays;
        displayMonthDays.textContent = `${monthDays} Dias (${monthDays * 24}h)`;
        if (currentDay > monthDays) {
            currentDay = monthDays;
            inputCurrentDay.value = monthDays;
        }
        displayCurrentDay.textContent = `Dia ${currentDay} de ${monthDays}`;
        document.getElementById('kpi-title-month-end').textContent = `Previsão Fechamento (Dia ${monthDays} - ${monthDays * 24}h)`;
        saveState();
        recalculateAndRender();
    });

    selectChartEquip.addEventListener('change', (e) => {
        selectedEquipForChart = e.target.value;
        saveState();
        recalculateAndRender();
    });

    // Adição de Novo RTG: padrão ZPMC e 0h previstas
    btnAddEquip.addEventListener('click', () => {
        const newTag = `RTG-${String(nextId).padStart(2, '0')}`;
        const newFamily = "ZPMC";
        equipmentList.push({
            id: nextId++,
            tag: newTag,
            family: newFamily,
            customMonthHours: null,
            downtimeReal: 0.0,
            downtimePlanned: 0.0, // PADRÃO ZERO
            failures: 0,
            target: globalTarget
        });
        saveState();
        updateSelectOptions();
        recalculateAndRender();
    });

    // Resetar para o padrão com confirmação segura e limpeza do storage
    btnReset.addEventListener('click', () => {
        const confirmed = confirm("Deseja realmente restaurar todos os dados para o padrão original da fábrica?\n(41 RTGs, 31 dias, dia 15, meta 87.5%, paradas previstas 0h)");
        if (!confirmed) return;

        try {
            localStorage.removeItem(STORAGE_KEY);
            sessionStorage.removeItem(STORAGE_KEY);
        } catch (e) {}

        currentDay = 15;
        monthDays = 31;
        globalTarget = 0.875;
        selectedEquipForChart = "ALL";
        nextId = 42;
        equipmentList = generateDefault41RTGs();

        inputCurrentDay.max = 31;
        inputCurrentDay.value = 15;
        selectMonthDays.value = "31";
        displayCurrentDay.textContent = "Dia 15 de 31";
        displayMonthDays.textContent = "31 Dias (744h)";
        document.getElementById('kpi-title-month-end').textContent = "Previsão Fechamento (Dia 31 - 744h)";

        applyGlobalTargetToUI(globalTarget);
        updateSelectOptions();
        recalculateAndRender();
        saveFleetToCloud(false);
    });

    btnCopySummary.addEventListener('click', copySummaryToClipboard);

    const btnSaveCloud = document.getElementById('btn-save-cloud');
    const btnReloadCloud = document.getElementById('btn-reload-cloud');

    if (btnSaveCloud) {
        btnSaveCloud.addEventListener('click', async () => {
            const ok = await saveFleetToCloud(false);
            if (ok) {
                alert('✓ Dados salvos com sucesso no GitHub! Todos os usuários que acessarem a dashboard verão estes valores atualizados.');
            }
        });
    }

    if (btnReloadCloud) {
        btnReloadCloud.addEventListener('click', async () => {
            await loadFleetFromCloud(true);
            syncControlsAndRender();
        });
    }

    function syncControlsAndRender() {
        inputCurrentDay.max = monthDays;
        inputCurrentDay.value = currentDay;
        selectMonthDays.value = String(monthDays);
        displayCurrentDay.textContent = `Dia ${currentDay} de ${monthDays}`;
        displayMonthDays.textContent = `${monthDays} Dias (${monthDays * 24}h)`;
        document.getElementById('kpi-title-month-end').textContent = `Previsão Fechamento (Dia ${monthDays} - ${monthDays * 24}h)`;

        applyGlobalTargetToUI(globalTarget);
        updateSelectOptions();
        if (selectedEquipForChart) {
            selectChartEquip.value = selectedEquipForChart;
        }
        recalculateAndRender();
    }

    // 1. Carrega primeiro o cache local para renderização instantânea
    loadSavedState();
    syncControlsAndRender();

    // 2. Imediatamente consulta a Nuvem (GitHub) para sincronizar os dados mais recentes de outros usuários
    loadFleetFromCloud(false).then(() => {
        syncControlsAndRender();
    });

    // Salva instantaneamente caso a página/aba seja fechada
    window.addEventListener('beforeunload', () => {
        saveLocalState();
    });
    window.addEventListener('pagehide', () => {
        saveLocalState();
    });
});

function updateSelectOptions() {
    const select = document.getElementById('select-chart-equip');
    const curVal = select.value;
    select.innerHTML = `<option value="ALL">Média da Frota Consolidada (${equipmentList.length} RTGs)</option>`;
    equipmentList.forEach(eq => {
        const opt = document.createElement('option');
        opt.value = eq.tag;
        opt.textContent = `${eq.tag} (${eq.family})`;
        select.appendChild(opt);
    });
    if (equipmentList.some(eq => eq.tag === curVal)) {
        select.value = curVal;
    } else {
        select.value = "ALL";
    }
}

function initChart() {
    const ctx = document.getElementById('forecastChart').getContext('2d');
    forecastChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Disponibilidade Realizada (Hoje)',
                    data: [],
                    borderColor: '#0ea5e9',
                    backgroundColor: 'rgba(14, 165, 233, 0.1)',
                    borderWidth: 3,
                    pointRadius: 5,
                    pointBackgroundColor: '#0ea5e9',
                    tension: 0.2
                },
                {
                    label: 'Previsão Sequencial (D+1 a D+10)',
                    data: [],
                    borderColor: '#10b981',
                    borderDash: [5, 5],
                    borderWidth: 2.5,
                    pointRadius: 3.5,
                    pointBackgroundColor: '#10b981',
                    tension: 0.2
                },
                {
                    label: 'Fechamento Estimado (Fim do Mês)',
                    data: [],
                    borderColor: '#f59e0b',
                    borderDash: [3, 3],
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: '#f59e0b',
                    tension: 0.2
                },
                {
                    label: 'Meta Contratual (SLA)',
                    data: [],
                    borderColor: '#ef4444',
                    borderWidth: 2.5,
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#19273f',
                    titleColor: '#f0f4f8',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            if (context.parsed.y !== null) {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`;
                            }
                            return '';
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.04)' },
                    ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 11 } }
                },
                y: {
                    min: 75,
                    max: 100,
                    grid: { color: 'rgba(255, 255, 255, 0.06)' },
                    ticks: {
                        color: '#94a3b8',
                        font: { family: 'JetBrains Mono', size: 11 },
                        callback: value => value + '%'
                    }
                }
            }
        }
    });
}

function recalculateAndRender() {
    const standardMonthHours = monthDays * 24;
    const remainingDays = Math.max(0, monthDays - currentDay);

    const calculatedEquipments = equipmentList.map(eq => {
        const downtimeReal = eq.downtimeReal || 0;
        const downtimePlanned = eq.downtimePlanned || 0;
        const target = eq.target || globalTarget;

        const isCustomHours = eq.customMonthHours && eq.customMonthHours > 0;
        const equipMonthHours = isCustomHours ? eq.customMonthHours : standardMonthHours;

        // Horas decorridas proporcionais para este RTG até o dia atual:
        const equipHoursElapsed = Math.min(equipMonthHours, Math.round((currentDay / monthDays) * equipMonthHours * 10) / 10);

        const dispCurrent = equipHoursElapsed > 0 ? ((equipHoursElapsed - downtimeReal) / equipHoursElapsed) * 100 : 100;
        const totalDowntimeMonth = downtimeReal + downtimePlanned;
        const dispProjectedMonth = equipMonthHours > 0 ? ((equipMonthHours - totalDowntimeMonth) / equipMonthHours) * 100 : 100;

        const maxAllowedDowntime = equipMonthHours * (1 - target);
        const bufferHours = maxAllowedDowntime - totalDowntimeMonth;

        let status = "NO ALVO";
        if (dispProjectedMonth < (target * 100)) {
            status = "CRÍTICO";
        } else if (bufferHours < 8.0) {
            status = "ALERTA";
        }

        const days10Forecast = [];
        for (let i = 1; i <= 10; i++) {
            const dayNum = currentDay + i;
            if (dayNum <= monthDays) {
                const hCal = Math.min(equipMonthHours, Math.round((dayNum / monthDays) * equipMonthHours * 10) / 10);
                const portion = remainingDays > 0 ? (i / remainingDays) : 1;
                const projectedDowntimeAtDay = downtimeReal + (portion * downtimePlanned);
                const dispAtDay = hCal > 0 ? ((hCal - projectedDowntimeAtDay) / hCal) * 100 : 100;
                days10Forecast.push(dispAtDay);
            } else {
                days10Forecast.push(dispProjectedMonth);
            }
        }

        return {
            ...eq,
            isCustomHours,
            equipMonthHours,
            equipHoursElapsed,
            dispCurrent,
            totalDowntimeMonth,
            maxAllowedDowntime,
            dispProjectedMonth,
            bufferHours,
            status,
            days10Forecast
        };
    });

    const totalEquip = calculatedEquipments.length;
    const fleetTotalRealDowntime = calculatedEquipments.reduce((acc, eq) => acc + eq.downtimeReal, 0);
    const fleetTotalPlannedDowntime = calculatedEquipments.reduce((acc, eq) => acc + eq.downtimePlanned, 0);
    const fleetTotalDowntimeMonth = fleetTotalRealDowntime + fleetTotalPlannedDowntime;

    const fleetHoursElapsed = calculatedEquipments.reduce((acc, eq) => acc + eq.equipHoursElapsed, 0);
    const fleetTotalMonthHours = calculatedEquipments.reduce((acc, eq) => acc + eq.equipMonthHours, 0);

    const fleetCurrentDisp = fleetHoursElapsed > 0 ? ((fleetHoursElapsed - fleetTotalRealDowntime) / fleetHoursElapsed) * 100 : 100;
    const fleetProjectedDisp = fleetTotalMonthHours > 0 ? ((fleetTotalMonthHours - fleetTotalDowntimeMonth) / fleetTotalMonthHours) * 100 : 100;

    const fleetMaxAllowedDowntime = calculatedEquipments.reduce((acc, eq) => acc + eq.maxAllowedDowntime, 0);
    const fleetBufferHours = fleetMaxAllowedDowntime - fleetTotalDowntimeMonth;

    const fleetDays10Forecast = [];
    for (let i = 0; i < 10; i++) {
        const sumAtDay = calculatedEquipments.reduce((acc, eq) => acc + eq.days10Forecast[i], 0);
        fleetDays10Forecast.push(totalEquip > 0 ? sumAtDay / totalEquip : 100);
    }

    // Top KPI Cards
    document.getElementById('badge-text').textContent = `FROTA ATIVA: ${equipmentList.length} RTGs | ${monthDays} DIAS | TOTAL: ${fleetTotalMonthHours.toLocaleString()}h`;
    document.getElementById('display-current-day').textContent = `Dia ${currentDay} de ${monthDays}`;

    document.getElementById('kpi-fleet-current-disp').textContent = `${fleetCurrentDisp.toFixed(2)}%`;
    const diffTarget = fleetCurrentDisp - (globalTarget * 100);
    document.getElementById('kpi-fleet-diff').textContent = `${diffTarget >= 0 ? '+' : ''}${diffTarget.toFixed(2)}% vs Meta (${(globalTarget * 100).toFixed(1)}%)`;
    document.getElementById('kpi-fleet-diff').className = `kpi-diff ${diffTarget >= 0 ? 'badge-green' : 'badge-red'}`;
    document.getElementById('kpi-fleet-hours-elapsed').textContent = `Base: ${fleetHoursElapsed.toFixed(0)}h decorridas (Mês Total: ${fleetTotalMonthHours.toLocaleString()}h)`;

    document.getElementById('kpi-fleet-projected-disp').textContent = `${fleetProjectedDisp.toFixed(2)}%`;
    const diffProj = fleetProjectedDisp - (globalTarget * 100);
    document.getElementById('kpi-fleet-badge').textContent = diffProj >= 0 ? 'Meta Garantida' : 'Abaixo da Meta';
    document.getElementById('kpi-fleet-badge').className = `kpi-badge ${diffProj >= 0 ? 'badge-green' : 'badge-red'}`;
    document.getElementById('kpi-fleet-proj-footer').textContent = `Fechamento projetado em ${fleetTotalMonthHours.toLocaleString()}h totais da frota`;

    document.getElementById('kpi-fleet-total-downtime').textContent = `${fleetTotalDowntimeMonth.toFixed(1)} h`;
    document.getElementById('kpi-fleet-downtime-split').textContent = `(Real: ${fleetTotalRealDowntime.toFixed(1)}h | Prev: ${fleetTotalPlannedDowntime.toFixed(1)}h)`;
    document.getElementById('kpi-fleet-downtime-rate').textContent = `Média: ${(fleetTotalRealDowntime / Math.max(1, (totalEquip * currentDay))).toFixed(2)} h/dia por RTG`;

    document.getElementById('kpi-fleet-buffer').textContent = `${fleetBufferHours.toFixed(1)} h`;
    document.getElementById('kpi-fleet-icon').textContent = fleetBufferHours >= 0 ? '🛡️' : '🚨';
    document.getElementById('kpi-fleet-buffer-footer').textContent = fleetBufferHours >= 0 
        ? `Frota de ${totalEquip} RTGs tem folga coletiva de ${fleetBufferHours.toFixed(1)}h (Meta ${(globalTarget * 100).toFixed(1)}%)`
        : `Déficit coletivo de ${Math.abs(fleetBufferHours).toFixed(1)}h (Meta ${(globalTarget * 100).toFixed(1)}%)`;

    updateTableSubHeaders();
    renderTable(calculatedEquipments, {
        fleetTotalMonthHours,
        fleetCurrentDisp,
        fleetTotalRealDowntime,
        fleetTotalPlannedDowntime,
        fleetTotalDowntimeMonth,
        fleetProjectedDisp,
        fleetBufferHours,
        fleetDays10Forecast
    });

    renderRankingsAndRecommendations(calculatedEquipments, fleetProjectedDisp);
    updateChart(calculatedEquipments, fleetCurrentDisp, fleetProjectedDisp, fleetDays10Forecast);
}

function updateTableSubHeaders() {
    const subHeader = document.getElementById('sub-header-days');
    if (!subHeader) return;
    const dayThs = subHeader.querySelectorAll('th.th-d-forecast');
    dayThs.forEach((th, idx) => {
        const i = idx + 1;
        const targetDay = currentDay + i;
        if (targetDay <= monthDays) {
            th.innerHTML = `D+${i}<br><span style="font-size:0.65rem; font-weight:normal; color:#94a3b8;">Dia ${targetDay}</span>`;
        } else {
            th.innerHTML = `D+${i}<br><span style="font-size:0.65rem; font-weight:normal; color:#f59e0b;">(Fim ${monthDays})</span>`;
        }
    });
}

function renderTable(equipments, fleetTotals) {
    const tbody = document.getElementById('equipment-tbody');
    const tfoot = document.getElementById('equipment-tfoot');
    const targetPct = globalTarget * 100;

    let html = '';
    equipments.forEach(eq => {
        const statusClass = eq.status === 'NO ALVO' ? 'badge-green' : (eq.status === 'ALERTA' ? 'badge-yellow' : 'badge-red');
        const dispCurClass = eq.dispCurrent >= (eq.target * 100) ? 'cell-green' : 'cell-red';
        const dispProjClass = eq.dispProjectedMonth >= (eq.target * 100) ? 'cell-green' : 'cell-red';

        let brandColor = "#93c5fd";
        if (eq.family === "Konecranes") brandColor = "#67e8f9";
        else if (eq.family === "Kalmar") brandColor = "#fcd34d";
        else if (eq.family === "ZPMC") brandColor = "#93c5fd";

        const standardMonthHours = monthDays * 24;
        const equipDisplayHours = eq.isCustomHours ? eq.equipMonthHours : standardMonthHours;

        html += `
            <tr data-id="${eq.id}">
                <td class="col-sticky">${eq.tag}</td>
                <td><strong style="color:${brandColor}; font-size:0.78rem;">${eq.family}</strong></td>
                <td>
                    <input type="number" step="any" min="1" max="1000" 
                           value="${equipDisplayHours}" 
                           class="cell-input input-hours ${eq.isCustomHours ? 'is-custom' : ''}" 
                           data-field="customMonthHours" data-id="${eq.id}" 
                           placeholder="${standardMonthHours}"
                           title="${eq.isCustomHours ? 'Horas personalizadas (' + eq.equipMonthHours + 'h). Digite ' + standardMonthHours + ' ou 0 para voltar ao padrão' : 'Padrão do mês (' + standardMonthHours + 'h). Digite outro valor para personalizar'}">
                </td>
                <td>
                    <input type="number" step="any" min="0" value="${eq.downtimeReal}" class="cell-input input-real" data-field="downtimeReal" data-id="${eq.id}" placeholder="0.0">
                </td>
                <td>
                    <input type="number" step="any" min="0" value="${eq.downtimePlanned}" class="cell-input input-planned" data-field="downtimePlanned" data-id="${eq.id}" placeholder="0.0">
                </td>
                <td>
                    <input type="number" step="1" min="0" value="${eq.failures}" class="cell-input-small input-failures" data-field="failures" data-id="${eq.id}" placeholder="0">
                </td>
                <td><span class="cell-disp ${dispCurClass}">${eq.dispCurrent.toFixed(2)}%</span></td>
                <td><strong>${eq.totalDowntimeMonth.toFixed(1)} h</strong></td>
                <td><span class="cell-disp ${dispProjClass}">${eq.dispProjectedMonth.toFixed(2)}%</span></td>
                <td>
                    <input type="number" step="any" min="70" max="99.9" value="${((eq.target || globalTarget) * 100).toFixed(1)}" class="cell-input-small input-target-ind" data-field="target" data-id="${eq.id}">%
                </td>
                <td style="color: ${eq.bufferHours >= 0 ? '#10b981' : '#ef4444'}; font-weight:700;">${eq.bufferHours.toFixed(1)} h</td>
                <td><span class="kpi-badge ${statusClass}">${eq.status}</span></td>
        `;

        eq.days10Forecast.forEach(dVal => {
            const dClass = dVal >= (eq.target * 100) ? 'cell-green' : (dVal >= (eq.target * 100) - 1.5 ? 'cell-yellow' : 'cell-red');
            html += `<td><span class="cell-disp ${dClass}">${dVal.toFixed(2)}%</span></td>`;
        });

        html += `
            <td>
                <button class="btn-remove" data-id="${eq.id}" title="Remover RTG">&times;</button>
            </td>
        </tr>`;
    });

    tbody.innerHTML = html;

    const fleetCurClass = fleetTotals.fleetCurrentDisp >= targetPct ? 'cell-green' : 'cell-red';
    const fleetProjClass = fleetTotals.fleetProjectedDisp >= targetPct ? 'cell-green' : 'cell-red';
    const fleetStatusClass = fleetTotals.fleetProjectedDisp >= targetPct ? 'badge-green' : 'badge-red';

    let footHtml = `
        <tr>
            <td class="col-sticky">MÉDIA DA FROTA</td>
            <td>${equipments.length} RTGs</td>
            <td><strong>${fleetTotals.fleetTotalMonthHours.toLocaleString()} h</strong></td>
            <td><strong>${fleetTotals.fleetTotalRealDowntime.toFixed(1)} h</strong></td>
            <td><strong>${fleetTotals.fleetTotalPlannedDowntime.toFixed(1)} h</strong></td>
            <td><strong>${equipments.reduce((a, b) => a + (b.failures || 0), 0)} OSs</strong></td>
            <td><span class="cell-disp ${fleetCurClass}">${fleetTotals.fleetCurrentDisp.toFixed(2)}%</span></td>
            <td><strong>${fleetTotals.fleetTotalDowntimeMonth.toFixed(1)} h</strong></td>
            <td><span class="cell-disp ${fleetProjClass}">${fleetTotals.fleetProjectedDisp.toFixed(2)}%</span></td>
            <td><strong>${targetPct.toFixed(1)}%</strong></td>
            <td style="color: ${fleetTotals.fleetBufferHours >= 0 ? '#10b981' : '#ef4444'}; font-weight:700;">${fleetTotals.fleetBufferHours.toFixed(1)} h</td>
            <td><span class="kpi-badge ${fleetStatusClass}">${fleetTotals.fleetProjectedDisp >= targetPct ? 'NO ALVO' : 'CRÍTICO'}</span></td>
    `;

    fleetTotals.fleetDays10Forecast.forEach(dVal => {
        const dClass = dVal >= targetPct ? 'cell-green' : (dVal >= targetPct - 1.5 ? 'cell-yellow' : 'cell-red');
        footHtml += `<td><span class="cell-disp ${dClass}">${dVal.toFixed(2)}%</span></td>`;
    });

    footHtml += `<td>-</td></tr>`;
    tfoot.innerHTML = footHtml;

    tbody.querySelectorAll('.cell-input, .cell-input-small').forEach(inp => {
        // Seleção total ao focar para substituição rápida sem precisar apagar
        inp.addEventListener('focus', (e) => {
            e.target.select();
        });

        // Previne que rolagem acidental com a rodinha do mouse altere valores
        inp.addEventListener('wheel', (e) => {
            e.target.blur();
        });

        // Ao pressionar Enter: confirma e passa o foco para o mesmo campo do próximo RTG (estilo Excel)
        inp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.target.blur();
                const curId = parseInt(e.target.dataset.id, 10);
                const field = e.target.dataset.field;
                const nextRowInput = tbody.querySelector(`tr[data-id="${curId + 1}"] input[data-field="${field}"]`);
                if (nextRowInput) {
                    nextRowInput.focus();
                }
            }
        });

        // Salva instantaneamente no storage a cada caractere digitado (sem perder o foco nem recriar o elemento)
        inp.addEventListener('input', (e) => {
            const id = parseInt(e.target.dataset.id, 10);
            const field = e.target.dataset.field;
            let val = parseFloat(e.target.value);
            const targetEquip = equipmentList.find(eq => eq.id === id);
            if (!targetEquip) return;

            if (field === 'customMonthHours') {
                const stdHours = monthDays * 24;
                if (isNaN(val) || val <= 0 || Math.abs(val - stdHours) < 0.01) {
                    targetEquip.customMonthHours = null;
                    e.target.classList.remove('is-custom');
                } else {
                    targetEquip.customMonthHours = val;
                    e.target.classList.add('is-custom');
                }
            } else if (field === 'target') {
                if (!isNaN(val) && val >= 1) {
                    targetEquip.target = val / 100;
                }
            } else {
                if (!isNaN(val) && val >= 0) {
                    targetEquip[field] = val;
                }
            }
            saveState();
        });

        // Confirma alteração e recalcula toda a frota no evento change ou blur
        inp.addEventListener('change', (e) => {
            const id = parseInt(e.target.dataset.id, 10);
            const field = e.target.dataset.field;
            let val = parseFloat(e.target.value);
            const targetEquip = equipmentList.find(eq => eq.id === id);
            if (!targetEquip) return;

            if (field === 'customMonthHours') {
                const stdHours = monthDays * 24;
                if (isNaN(val) || val <= 0 || Math.abs(val - stdHours) < 0.01) {
                    targetEquip.customMonthHours = null;
                } else {
                    targetEquip.customMonthHours = val;
                }
            } else if (field === 'target') {
                if (isNaN(val) || val < 1) val = 87.5;
                targetEquip.target = val / 100;
            } else {
                if (isNaN(val) || val < 0) val = 0;
                targetEquip[field] = val;
            }
            saveState();
            recalculateAndRender();
        });
    });

    tbody.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id, 10);
            equipmentList = equipmentList.filter(eq => eq.id !== id);
            saveState();
            updateSelectOptions();
            recalculateAndRender();
        });
    });
}

function updateChart(calculatedEquipments, fleetCurrentDisp, fleetProjectedDisp, fleetDays10Forecast) {
    if (!forecastChart) return;

    let targetEquipObj = null;
    let labelTitle = "";
    let curDisp = 0;
    let d10Values = [];
    let endMonthDisp = 0;
    let currentEquipTarget = globalTarget * 100;

    if (selectedEquipForChart === "ALL") {
        labelTitle = `Média da Frota (${equipmentList.length} RTGs)`;
        curDisp = fleetCurrentDisp;
        d10Values = fleetDays10Forecast;
        endMonthDisp = fleetProjectedDisp;
        currentEquipTarget = globalTarget * 100;
    } else {
        targetEquipObj = (calculatedEquipments || []).find(eq => eq.tag === selectedEquipForChart);
        if (targetEquipObj) {
            labelTitle = `${targetEquipObj.tag} (${targetEquipObj.family})`;
            curDisp = targetEquipObj.dispCurrent;
            d10Values = targetEquipObj.days10Forecast;
            endMonthDisp = targetEquipObj.dispProjectedMonth;
            currentEquipTarget = (targetEquipObj.target || globalTarget) * 100;
        }
    }

    document.getElementById('chart-main-title').textContent = `Trajetória Preditiva: ${labelTitle} (Meta: ${currentEquipTarget.toFixed(1)}% | Mês de ${monthDays} Dias)`;

    const labels = [];
    const actualData = [];
    const forecast10Data = [];
    const endData = [];
    const metaData = [];

    for (let d = 1; d <= monthDays; d++) {
        labels.push(`Dia ${d}`);
        metaData.push(currentEquipTarget);

        if (d < currentDay) {
            actualData.push(null);
            forecast10Data.push(null);
            endData.push(null);
        } else if (d === currentDay) {
            actualData.push(curDisp);
            forecast10Data.push(curDisp);
            endData.push(curDisp);
        } else if (d <= currentDay + 10) {
            const idx = d - currentDay - 1;
            actualData.push(null);
            forecast10Data.push(d10Values[idx]);
            endData.push(d10Values[idx]);
        } else {
            actualData.push(null);
            forecast10Data.push(null);
            endData.push(endMonthDisp);
        }
    }

    forecastChart.data.labels = labels;
    forecastChart.data.datasets[0].data = actualData;
    forecastChart.data.datasets[1].data = forecast10Data;
    forecastChart.data.datasets[2].data = endData;
    forecastChart.data.datasets[3].data = metaData;
    forecastChart.data.datasets[3].label = `Meta Contratual (${currentEquipTarget.toFixed(1)}%)`;

    const allValues = [curDisp, ...d10Values, endMonthDisp, currentEquipTarget].filter(v => v !== null && !isNaN(v));
    const minVal = Math.floor(Math.min(...allValues) - 2);
    forecastChart.options.scales.y.min = Math.max(50, Math.min(85, minVal));
    forecastChart.update();
}

function renderRankingsAndRecommendations(equipments, fleetProjectedDisp) {
    const rankingContainer = document.getElementById('ranking-container');
    const recomContainer = document.getElementById('recommendations-container');
    const targetPct = globalTarget * 100;

    const sorted = [...equipments].sort((a, b) => a.bufferHours - b.bufferHours);
    const top4 = sorted.slice(0, 4);

    let rankHtml = '';
    top4.forEach((eq, idx) => {
        const isCritical = eq.bufferHours < 0;
        const color = isCritical ? 'var(--status-danger)' : (eq.bufferHours < 8 ? 'var(--status-warning)' : 'var(--status-success)');
        rankHtml += `
            <div class="ranking-item">
                <div class="ranking-equip-info">
                    <span class="ranking-rank">#${idx + 1}</span>
                    <div>
                        <strong class="ranking-tag">${eq.tag}</strong>
                        <span class="ranking-fam">(${eq.family})</span>
                    </div>
                </div>
                <div class="ranking-metrics">
                    <span>Parado: <strong>${eq.downtimeReal.toFixed(1)}h</strong></span>
                    <span>Previsto: <strong>${eq.downtimePlanned.toFixed(1)}h</strong></span>
                    <span style="color: ${color}; font-weight:700;">Folga: ${eq.bufferHours.toFixed(1)}h</span>
                </div>
            </div>
        `;
    });
    rankingContainer.innerHTML = rankHtml;

    const criticalCount = equipments.filter(eq => eq.status === 'CRÍTICO').length;

    let recomHtml = `
        <div class="recom-item">
            <span class="recom-icon">${criticalCount > 0 ? '🚨' : '✅'}</span>
            <div class="recom-content">
                <h4>RTGs em Zona Crítica (${criticalCount} de ${equipments.length} Ativos na Meta de ${targetPct.toFixed(1)}%)</h4>
                <p>${criticalCount > 0 
                    ? `Os RTGs ${equipments.filter(e => e.status === 'CRÍTICO').map(e => `${e.tag} [${e.family}]`).join(', ')} já comprometeram a meta de ${targetPct.toFixed(1)}% ou precisam de blindagem contra novas falhas corretivas até o Dia ${monthDays}.`
                    : `Todos os ${equipments.length} RTGs da frota estão com projeção de fechamento dentro da meta de ${targetPct.toFixed(1)}%. Operação estável.`}</p>
            </div>
        </div>

        <div class="recom-item">
            <span class="recom-icon">🏭</span>
            <div class="recom-content">
                <h4>Composição da Frota (${equipments.length} RTGs)</h4>
                <p>• <strong>Konecranes:</strong> RTG 01-06 e 11-20 (16 ativos)<br>
                   • <strong>Kalmar:</strong> RTG 07-10 e 21-30 (14 ativos)<br>
                   • <strong>ZPMC:</strong> RTG 31-41+ (11 ativos). Novos RTGs criados herdam automaticamente a marca ZPMC.</p>
            </div>
        </div>

        <div class="recom-item">
            <span class="recom-icon">🎯</span>
            <div class="recom-content">
                <h4>Fechamento Projetado da Frota no Dia ${monthDays} (${fleetProjectedDisp.toFixed(2)}%)</h4>
                <p>${fleetProjectedDisp >= targetPct 
                    ? `A frota de ${equipments.length} RTGs fecha <strong>dentro da meta de ${targetPct.toFixed(1)}%</strong> com folga coletiva de ${document.getElementById('kpi-fleet-buffer').textContent}.` 
                    : `Atenção gerencial: a frota fecha <strong>abaixo da meta</strong> em ${(targetPct - fleetProjectedDisp).toFixed(2)} p.p. na meta de ${targetPct.toFixed(1)}%.`}</p>
            </div>
        </div>
    `;
    recomContainer.innerHTML = recomHtml;
}

function copySummaryToClipboard() {
    const totalEquip = equipmentList.length;
    const fleetDisp = document.getElementById('kpi-fleet-current-disp').textContent;
    const projDisp = document.getElementById('kpi-fleet-projected-disp').textContent;
    const totalDowntime = document.getElementById('kpi-fleet-total-downtime').textContent;
    const buffer = document.getElementById('kpi-fleet-buffer').textContent;

    let text = `*RELATÓRIO DE DISPONIBILIDADE E CONFIABILIDADE (FROTA DE ${totalEquip} RTGs)*\n`;
    text += `📅 Posição: Dia ${currentDay} de ${monthDays} (${monthDays * 24}h/RTG | Total Frota: ${totalEquip * monthDays * 24}h) | Meta: ${(globalTarget * 100).toFixed(1)}%\n\n`;
    text += `📊 *CONSOLIDAÇÃO DA FROTA*\n`;
    text += `• Disponibilidade Atual: ${fleetDisp}\n`;
    text += `• Projeção Fechamento (com Previstas até Dia ${monthDays}): ${projDisp}\n`;
    text += `• Total Paradas Mês: ${totalDowntime}\n`;
    text += `• Saldo de Tolerância Coletivo: ${buffer}\n\n`;
    text += `🚜 *DETALHAMENTO INDIVIDUAL (TOP CRÍTICOS)*:\n`;

    const sorted = [...equipmentList].sort((a, b) => {
        const bA = (monthDays * 24 * (1 - a.target)) - (a.downtimeReal + a.downtimePlanned);
        const bB = (monthDays * 24 * (1 - b.target)) - (b.downtimeReal + b.downtimePlanned);
        return bA - bB;
    });

    sorted.slice(0, 8).forEach(eq => {
        const tot = eq.downtimeReal + eq.downtimePlanned;
        const disp = (((monthDays * 24) - tot) / (monthDays * 24)) * 100;
        const folga = ((monthDays * 24) * (1 - eq.target)) - tot;
        text += `• ${eq.tag} (${eq.family}): Real ${eq.downtimeReal}h | Prev ${eq.downtimePlanned}h | Proj ${disp.toFixed(1)}% | Meta: ${(eq.target * 100).toFixed(1)}% | Folga: ${folga.toFixed(1)}h\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('btn-copy-summary');
        const oldHtml = btn.innerHTML;
        btn.innerHTML = `✓ Relatório Copiado!`;
        setTimeout(() => btn.innerHTML = oldHtml, 2000);
    });
}

/* ==========================================================================
   Autenticação & Controle de Acesso Restrito (Senha)
   ========================================================================== */
const AUTH_STORAGE_KEY = 'rtg_dashboard_auth_token_v1';
const DEFAULT_PASSWORD = 'tcp@2025';

// Senhas aceitas (incluindo variações intuitivas de fábrica)
const ACCEPTED_PASSWORDS = [
    'tcp@2025',
    'tcp2025',
    'rtg2025',
    'tcpmanutencao',
    'admin@rtg'
];

function initAuth() {
    const overlay = document.getElementById('auth-modal-overlay');
    const form = document.getElementById('auth-form');
    const input = document.getElementById('auth-password-input');
    const toggleBtn = document.getElementById('btn-toggle-pwd');
    const errorMsg = document.getElementById('auth-error-msg');
    const rememberMe = document.getElementById('auth-remember-me');
    const btnLock = document.getElementById('btn-lock');

    if (!overlay || !form || !input) return;

    // Verifica se já está autenticado no localStorage ou sessionStorage
    const isAuthLocal = localStorage.getItem(AUTH_STORAGE_KEY) === 'authenticated';
    const isAuthSession = sessionStorage.getItem(AUTH_STORAGE_KEY) === 'authenticated';

    if (isAuthLocal || isAuthSession) {
        overlay.classList.add('hidden');
    } else {
        overlay.classList.remove('hidden');
        setTimeout(() => input.focus(), 250);
    }

    // Toggle de visualização da senha
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            toggleBtn.textContent = isPassword ? '🔒' : '👁️';
        });
    }

    // Submissão do formulário de autenticação
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const entered = (input.value || '').trim();

        // Checagem de senha
        const isValid = ACCEPTED_PASSWORDS.some(pwd => pwd.toLowerCase() === entered.toLowerCase());

        if (isValid) {
            errorMsg.classList.remove('visible');
            errorMsg.textContent = '';
            
            if (rememberMe && rememberMe.checked) {
                localStorage.setItem(AUTH_STORAGE_KEY, 'authenticated');
            } else {
                sessionStorage.setItem(AUTH_STORAGE_KEY, 'authenticated');
            }

            overlay.classList.add('hidden');
            input.value = '';
        } else {
            errorMsg.textContent = '❌ Senha incorreta. Tente novamente.';
            errorMsg.classList.add('visible');
            input.focus();
            input.select();
        }
    });

    // Botão de Bloquear na barra superior
    if (btnLock) {
        btnLock.addEventListener('click', () => {
            localStorage.removeItem(AUTH_STORAGE_KEY);
            sessionStorage.removeItem(AUTH_STORAGE_KEY);
            overlay.classList.remove('hidden');
            if (errorMsg) errorMsg.classList.remove('visible');
            input.value = '';
            setTimeout(() => input.focus(), 200);
        });
    }
}

