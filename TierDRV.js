// ========================================================
// 🌟 ระบบจัดการระดับชั้นส่วนกลาง (Centralized Tier Management)
// ========================================================

// ตัวแปรส่วนกลางสำหรับเก็บข้อมูลระดับชั้น
window.systemTiersMap = {}; 
window.tierLevels = {}; 

// 🌟 ฟังก์ชันช่วยสร้างป้ายสีระดับชั้น
// 🌟 ฟังก์ชันช่วยสร้างป้ายสีระดับชั้น (คืนชีพสีสันจัดเต็ม)
window.getTierBadgeHtml = function(currentTier) {
    let tierName = currentTier || 'New';
    
    // ดึงข้อมูลธีมสีจาก RAM ส่วนกลาง
    let tierData = window.systemTiersMap ? window.systemTiersMap[tierName] : null;
    let theme = tierData ? tierData.theme : 'default';

    // ดักไว้: ถ้าเป็นคนขับใหม่ (New) แล้วยังไม่มีการตั้งค่า ให้สาดป้ายสีเขียวเหนี่ยวทรัพย์ใส่เลย
    if (tierName === 'New' && theme === 'default') {
        theme = 'emerald';
    }

    // 🎨 คลังแสงแม่สีป้ายกำกับ (ดีไซน์ใหม่ สีเด้งๆ)
    const themes = {
        'default': `<span class="bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm whitespace-nowrap">${tierName}</span>`,
        
        'emerald': `<span class="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm whitespace-nowrap">🔰 ${tierName}</span>`,
        
        'slate': `<span class="bg-slate-100 text-slate-600 border border-slate-300 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm whitespace-nowrap">${tierName}</span>`,
        
        'amber': `<span class="bg-amber-50 text-amber-600 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm whitespace-nowrap">⭐ ${tierName}</span>`,
        
        'blue': `<span class="bg-blue-50 text-blue-600 border border-blue-300 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm whitespace-nowrap"><i class="far fa-gem mr-0.5"></i>${tierName}</span>`,
        
        'legend': `<span class="bg-gradient-to-r from-purple-500 to-pink-500 text-white border border-pink-400 px-2 py-0.5 rounded text-[10px] font-black shadow-md whitespace-nowrap uppercase tracking-wider"><i class="fas fa-fire mr-1"></i>${tierName}</span>`,
        
        'owner': `<span class="bg-gradient-to-r from-gray-900 to-yellow-600 text-yellow-400 border border-yellow-500 px-2 py-0.5 rounded text-[10px] font-black shadow-md whitespace-nowrap uppercase tracking-wider"><i class="fas fa-crown mr-1"></i>${tierName}</span>`
    };

    return themes[theme] || themes['default'];
}

// 🌟 ดึงข้อมูลจาก Firebase มาเก็บไว้และอัปเดตหน้าตาเว็บ
db.ref('config/tiers').on('value', snap => {
    let container = document.getElementById('tier-list-container');
    if(!container) return;
    
    let html = ''; let questTierHtml = ''; let adjustModalHtml = '';
    let airdropHtml = '<option value="all">🌐 แจกทุกคนในระบบ (ทุกระดับชั้น)</option>';
    let filterBlockedHtml = '<option value="all">ทุกระดับชั้น</option>';
    let filterQuestHtml = '<option value="all">เป้าหมาย: ทุกระดับชั้น</option>';
    let rewardTierHtml = '<option value="none">-- ไม่เลื่อน --</option>';

    window.systemTiersMap = {}; window.tierLevels = {};
    let tiersList = [];

    if(snap.exists()) {
        snap.forEach(child => {
            let data = child.val();
            tiersList.push({ 
                name: child.key, 
                level: data.rankLevel || 1,
                theme: data.badgeTheme || 'default',
                desc: data.description || 'ไม่มีคำอธิบาย'
            });
        });

        tiersList.sort((a, b) => a.level - b.level);

        tiersList.forEach((t) => {
            // เก็บข้อมูลลง RAM
            window.systemTiersMap[t.name] = { desc: t.desc, theme: t.theme };
            window.tierLevels[t.name] = t.level; 

            html += `
            <div class="border-gray-200 bg-white shadow-sm border p-4 rounded-xl flex justify-between items-center hover:shadow-md transition group">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gradient-to-br from-amber-200 to-amber-400 rounded-full flex items-center justify-center text-lg shadow-sm"><i class="fas fa-medal"></i></div>
                    <div>
                        <h3 class="font-black text-black text-sm">LV.${t.level} : ${t.name}</h3>
                        <p class="text-[10px] text-black mb-1">${t.desc}</p>
                        <div>${window.getTierBadgeHtml(t.name)}</div>
                    </div>
                </div>
                <div class="flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="openTierModal('${t.name}', '${t.desc}', ${t.level}, '${t.theme}')" class="w-8 h-8 hover:text-brand rounded-lg transition text-xs flex items-center justify-center"><i class="fas fa-pen"></i></button>
                    <button onclick="deleteTierData('${t.name}')" class="w-8 h-8 hover:text-red-500 rounded-lg transition text-xs flex items-center justify-center"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;

            questTierHtml += `<label class="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-black "><input type="checkbox" value="${t.name}" class="quest-target-tier w-4 h-4 accent-amber-500" onchange="updateQuestDropdownText()"> ${t.name}</label>`;
            adjustModalHtml += `<option value="${t.name}">${t.name}</option>`;
            airdropHtml += `<option value="${t.name}">🎁 แจกเฉพาะกลุ่ม ${t.name}</option>`;
            filterBlockedHtml += `<option value="${t.name}">เฉพาะ ${t.name}</option>`;
            filterQuestHtml += `<option value="${t.name}">เฉพาะ ${t.name}</option>`;
            rewardTierHtml += `<option value="${t.name}">เลื่อนเป็น ${t.name}</option>`;
        });
    }
    
    container.innerHTML = html || '<div class="col-span-full py-10 text-center text-black font-bold">ยังไม่มีข้อมูลระดับชั้นในระบบ</div>';
    
    // อัปเดต Dropdown ต่างๆ ในระบบ
    if(document.getElementById('quest-target-tier-container')) document.getElementById('quest-target-tier-container').innerHTML = questTierHtml;
    if(document.getElementById('trm-tier-select')) document.getElementById('trm-tier-select').innerHTML = adjustModalHtml;
    if(document.getElementById('airdrop-tier-select')) document.getElementById('airdrop-tier-select').innerHTML = airdropHtml;
    if(document.getElementById('filter-blocked-tier')) document.getElementById('filter-blocked-tier').innerHTML = filterBlockedHtml;
    if(document.getElementById('abh-filter-tier')) document.getElementById('abh-filter-tier').innerHTML = filterBlockedHtml;
    if(document.getElementById('filter-quest-tier')) document.getElementById('filter-quest-tier').innerHTML = filterQuestHtml;
    if(document.getElementById('quest-reward-tier')) document.getElementById('quest-reward-tier').innerHTML = rewardTierHtml;

    if(typeof window.loadCentralOptionsForCommission === 'function') window.loadCentralOptionsForCommission();
    if(typeof window.renderDriversTable === 'function') window.renderDriversTable();
    if(typeof window.renderSocialLeaderboard === 'function') window.renderSocialLeaderboard();
});

// 🌟 เปิดป๊อปอัปแก้ไขระดับชั้น
window.openTierModal = function(id = '', desc = '', level = 1, theme = 'default') {
    document.getElementById('tier-old-id').value = id;
    document.getElementById('tier-input-name').value = id; 
    document.getElementById('tier-input-desc').value = desc;
    document.getElementById('tier-input-level').value = level; 
    document.getElementById('tier-input-theme').value = theme; 

    document.getElementById('tier-modal-title').innerHTML = id ? '<i class="fas fa-edit mr-1"></i> แก้ไขระดับชั้น' : '<i class="fas fa-plus-circle mr-1"></i> เพิ่มระดับชั้นใหม่';
    openModal('modalTierForm');
}

// 🌟 บันทึกข้อมูลระดับชั้น
window.saveTierData = function() {
    let oldId = document.getElementById('tier-old-id').value;
    let newName = document.getElementById('tier-input-name').value.trim();
    let desc = document.getElementById('tier-input-desc').value.trim();
    let level = parseInt(document.getElementById('tier-input-level').value) || 1; 
    let theme = document.getElementById('tier-input-theme').value; 
    
    if(!newName) return showCustomAlert('ข้อมูลไม่ครบ', 'กรุณาพิมพ์ชื่อระดับชั้นด้วยครับ', 'error');
    if(/[.#$\\[\\]]/.test(newName)) return showCustomAlert('ชื่อไม่ถูกต้อง', 'ห้ามใช้สัญลักษณ์พิเศษ ( . # $ [ ] ) ในชื่อระดับชั้น', 'error');

    if(oldId && oldId !== newName) db.ref('config/tiers/' + oldId).remove();

    db.ref('config/tiers/' + newName).set({ 
        description: desc, 
        rankLevel: level, 
        badgeTheme: theme, 
        updatedAt: firebase.database.ServerValue.TIMESTAMP 
    }).then(() => {
        showCustomAlert('บันทึกสำเร็จ', `อัปเดตระดับชั้น ${newName} เรียบร้อยแล้ว`, 'success'); 
        closeModal('modalTierForm');
    });
}

// 🌟 ลบข้อมูลระดับชั้น
window.deleteTierData = function(tierName) {
    showCustomConfirm('ยืนยันลบระดับชั้น?', `หากลบระดับ ${tierName} กฎคอมมิชชันที่ผูกกับระดับนี้อาจทำงานผิดพลาดได้!`, () => {
        db.ref('config/tiers/' + tierName).remove().then(() => { showCustomAlert('ลบสำเร็จ', 'นำระดับชั้นออกจากระบบส่วนกลางแล้ว', 'success'); });
    }, 'ลบข้อมูล', 'red');
}
