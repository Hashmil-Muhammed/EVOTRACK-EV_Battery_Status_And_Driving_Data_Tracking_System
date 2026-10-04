document.addEventListener('DOMContentLoaded', () => {
    // API Endpoints
    const API_URL = '/api/logs';

    // DOM Elements
    const tableBody = document.getElementById('table-body');
    const tableFoot = document.getElementById('table-foot');
    const emptyState = document.getElementById('empty-state');
    const btnAddRecord = document.getElementById('btn-add-record');
    const btnAddRow = document.getElementById('btn-add-row');
    const btnEmptyAdd = document.getElementById('btn-empty-add');
    const btnExport = document.getElementById('btn-export');
    const btnThemeToggle = document.getElementById('btn-theme-toggle');
    const toastContainer = document.getElementById('toast-container');
    const monthTabs = document.getElementById('month-tabs');
    const searchInput = document.getElementById('search-input');
    const dialogOverlay = document.getElementById('dialog-overlay');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');

    const yearFilter = document.getElementById('year-filter');

    // State
    let logs = [];
    let editingCell = null; // { rowId, field, tdElement }
    let logToDelete = null;
    let currentFilterMonth = '';
    let selectedRows = new Set();
    let isMultiSelectMode = false;
    let bulkDeleteMode = false;

    // Multi-select DOM elements
    const tableWidget = document.getElementById('table-widget');
    const bulkToolbar = document.getElementById('multi-select-toolbar');
    const bulkCount = document.getElementById('multi-select-count');
    const btnBulkDelete = document.getElementById('btn-bulk-delete');
    const btnBulkCancel = document.getElementById('btn-bulk-cancel');
    let hoveredRowId = null;

    // Set default month and year
    const now = new Date();
    let selectedYear = now.getFullYear();
    currentFilterMonth = `${selectedYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Initialize Year Filter
    if (yearFilter) {
        let yearHtml = '';
        for (let y = 2024; y <= 2030; y++) {
            yearHtml += `<option value="${y}" ${y === selectedYear ? 'selected' : ''}>${y}</option>`;
        }
        yearFilter.innerHTML = yearHtml;

        yearFilter.addEventListener('change', (e) => {
            selectedYear = parseInt(e.target.value);
            currentFilterMonth = ''; // Default to "All logs" when year changes
            renderTable();
        });
    }

    // Initialize multi-select UI handlers
    function updateMultiSelectUI() {
        if (selectedRows.size > 0) {
            isMultiSelectMode = true;
            tableWidget.classList.add('multi-select-active');
            bulkToolbar.style.opacity = '1';
            bulkToolbar.style.pointerEvents = 'auto';
            bulkToolbar.style.transform = 'translateX(-50%) translateY(0)';
            bulkCount.textContent = `${selectedRows.size} selected`;
        } else {
            isMultiSelectMode = false;
            tableWidget.classList.remove('multi-select-active');
            bulkToolbar.style.opacity = '0';
            bulkToolbar.style.pointerEvents = 'none';
            bulkToolbar.style.transform = 'translateX(-50%) translateY(20px)';
        }
    }

    if (btnBulkCancel) {
        btnBulkCancel.addEventListener('click', () => {
            selectedRows.clear();
            renderTable();
            updateMultiSelectUI();
        });
    }

    if (btnBulkDelete) {
        btnBulkDelete.addEventListener('click', () => {
            if (selectedRows.size > 0) {
                bulkDeleteMode = true;
                openDialog(null);
            }
        });
    }

    // Initialize
    fetchLogs();

    // --- Theme Toggle ---
    const currentTheme = localStorage.getItem('theme') || 'light';
    if (currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    if (btnThemeToggle) {
        btnThemeToggle.addEventListener('click', () => {
            if (document.documentElement.getAttribute('data-theme') === 'dark') {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            }
        });
    }

    // Sidebar Toggle
    const sidebar = document.getElementById('sidebar');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    if (sidebar && sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Scroll listener for Top Nav Actions (Export, Hamburger, Menu links)
    const scrollContainer = document.querySelector('.main-content-wrapper');
    if (scrollContainer) {
        scrollContainer.addEventListener('scroll', (e) => {
            if (e.target.scrollTop > 150) {
                document.body.classList.add('scrolled');
            } else {
                document.body.classList.remove('scrolled');
            }
        }, { passive: true });
    }

    // Event Listeners
    if (btnAddRecord) btnAddRecord.addEventListener('click', createNewRow);
    if (btnAddRow) btnAddRow.addEventListener('click', createNewRow);
    if (btnEmptyAdd) btnEmptyAdd.addEventListener('click', createNewRow);

    btnCancelDelete.addEventListener('click', closeDialog);

    // --- Navigation ---
    const navItems = document.querySelectorAll('.top-navbar .nav-item');
    const viewSections = document.querySelectorAll('.view-section');

    // Hamburger Menu Logic
    const menuToggle = document.getElementById('menu-toggle');
    const slideMenu = document.getElementById('slide-menu');

    if (menuToggle && slideMenu) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            slideMenu.classList.toggle('active');
        });
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = item.getAttribute('data-view');
            if (!viewId) return;

            // Close slide menu on click
            if (menuToggle && slideMenu) {
                menuToggle.classList.remove('active');
                slideMenu.classList.remove('active');
            }

            // Update active state on nav
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Move table widget dynamically
            const tableWidget = document.getElementById('table-widget-container');
            if (tableWidget) {
                if (viewId === 'view-charging-logs') {
                    document.getElementById('view-charging-logs').appendChild(tableWidget);
                } else if (viewId === 'view-dashboard') {
                    document.getElementById('dashboard-table-mount').appendChild(tableWidget);
                }
            }

            // Show corresponding view, hide others
            viewSections.forEach(section => {
                if (section.id === viewId) {
                    section.classList.remove('hidden');
                } else {
                    section.classList.add('hidden');
                }
            });
        });
    });
    btnConfirmDelete.addEventListener('click', confirmDelete);

    btnExport.addEventListener('click', exportToCSV);

    if (searchInput) {
        searchInput.addEventListener('input', () => renderTable());
    }

    // Global click listener for closing dropdowns/inputs/menus
    document.addEventListener('mousedown', (e) => {
        if (editingCell) {
            const isClickInside = editingCell.td.contains(e.target);
            // Ignore if clicking inside a dropdown
            if (!isClickInside && !e.target.closest('.custom-dropdown')) {
                finishEditing(true); // Save on click outside
            }
        }

        // Close slide menu if clicking outside
        if (menuToggle && slideMenu && slideMenu.classList.contains('active')) {
            if (!slideMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                menuToggle.classList.remove('active');
                slideMenu.classList.remove('active');
            }
        }
    });

    // --- API Calls ---

    async function fetchLogs() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Failed to fetch logs');
            logs = await response.json();
            renderTable();
        } catch (error) {
            showToast('Error loading data: ' + error.message, 'error');
            console.error('Fetch Logs Error:', error);
        }
    }

    async function createNewRow() {
        // Defaults
        const newLog = {
            date: new Date().toISOString().split('T')[0],
            post_charge_percentage: 100,
            post_charge_mode: 'City',
            post_charge_level: 'L1',
            post_drive_mode: 'City',
            post_drive_level: 'L1'
        };

        try {
            showToast('Saving...', 'info');
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newLog)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText || 'Failed to create row');
            }

            const savedLog = await response.json();
            // Add to bottom of list
            logs.push(savedLog);
            renderTable();
            showToast('Record added successfully');

            // Focus on the new row's date after a slight delay
            setTimeout(() => {
                const newRow = document.querySelector(`tr[data-id="${savedLog.id}"]`);
                if (newRow) {
                    const dateCell = newRow.querySelector('[data-field="date"]');
                    if (dateCell) startEditing(savedLog.id, 'date', dateCell, 'date');
                }
            }, 100);

        } catch (error) {
            showToast('Failed to create record: ' + error.message, 'error');
            console.error('Create Row Error:', error);
        }
    }

    async function updateLog(id, updates) {
        // Optimistic update
        const index = logs.findIndex(l => l.id === id);
        if (index === -1) return;

        const originalLog = { ...logs[index] };
        logs[index] = { ...logs[index], ...updates };

        // Re-render just the row
        const row = document.querySelector(`tr[data-id="${id}"]`);
        if (row) {
            renderRowContent(row, logs[index]);
        }

        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (!response.ok) throw new Error('Failed to update');
            showToast('Saved ✓');
        } catch (error) {
            // Revert
            logs[index] = originalLog;
            if (row) renderRowContent(row, originalLog);
            showToast('Failed to save changes', 'error');
            console.error(error);
        }
    }

    async function deleteLog(id, skipRender = false) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete');

            logs = logs.filter(l => l.id !== parseInt(id));
            if (!skipRender) {
                renderTable();
                showToast('Record deleted');
            }
        } catch (error) {
            showToast('Failed to delete record', 'error');
            console.error(error);
        }
    }

    // --- Rendering ---

    function getMonthKey(dateStr) {
        if (!dateStr) return 'Unknown';
        const d = new Date(dateStr);
        if (isNaN(d)) return 'Unknown';
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    function formatMonthLabel(monthKey) {
        if (monthKey === 'Unknown') return 'Unknown';
        const [year, month] = monthKey.split('-');
        const d = new Date(year, parseInt(month) - 1, 1);
        return d.toLocaleString('default', { month: 'short', year: 'numeric' });
    }

    function renderTabs(filteredOutCount = 0) {
        if (!monthTabs) return;

        const monthCounts = {};
        logs.forEach(log => {
            const key = getMonthKey(log.date);
            monthCounts[key] = (monthCounts[key] || 0) + 1;
        });

        const sortedKeys = [];
        for (let i = 1; i <= 12; i++) {
            sortedKeys.push(`${selectedYear}-${String(i).padStart(2, '0')}`);
        }

        let html = `<button class="tab-item ${currentFilterMonth === '' ? 'active' : ''}" data-month="">
            All logs <span class="badge-count">${logs.length}</span>
        </button>`;

        sortedKeys.forEach(key => {
            const label = formatMonthLabel(key);
            const count = monthCounts[key] || 0;
            const isActive = currentFilterMonth === key ? 'active' : '';
            html += `<button class="tab-item ${isActive}" data-month="${key}">
                ${label} <span class="badge-count">${count}</span>
            </button>`;
        });

        monthTabs.innerHTML = html;

        monthTabs.querySelectorAll('.tab-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentFilterMonth = e.currentTarget.getAttribute('data-month');
                renderTable();
            });
        });
    }

    function renderTable() {
        tableBody.innerHTML = '';

        const searchTerm = (searchInput?.value || '').toLowerCase();

        const filteredLogs = logs.filter(log => {
            // Month filter
            if (currentFilterMonth !== '') {
                if (getMonthKey(log.date) !== currentFilterMonth) return false;
            } else {
                // Year filter for "All logs"
                const d = new Date(log.date);
                if (!isNaN(d) && d.getFullYear() !== selectedYear) return false;
            }
            // Search filter
            if (searchTerm) {
                const txt = Object.values(log).join(' ').toLowerCase();
                if (!txt.includes(searchTerm)) return false;
            }
            return true;
        });
        filteredLogs.sort((a, b) => {
            const dateDiff = new Date(a.date) - new Date(b.date);
            if (dateDiff === 0) return a.id - b.id;
            return dateDiff;
        });

        renderTabs(); // Update active tab

        if (filteredLogs.length === 0) {
            emptyState.classList.remove('hidden');
            tableFoot.classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            tableFoot.classList.remove('hidden');
            filteredLogs.forEach(log => {
                const tr = document.createElement('tr');
                tr.dataset.id = log.id;
                if (selectedRows.has(log.id)) {
                    tr.classList.add('selected');
                }
                renderRowContent(tr, log);
                tableBody.appendChild(tr);
            });
        }
        updateMultiSelectUI();
        updateTotals(filteredLogs);
        updateGlobalTotals();
    }

    function updateGlobalTotals() {
        let sumDistance = 0;
        let sumEvCost = 0;
        let sumPetrol = 0;
        let sumProfit = 0;

        logs.forEach(log => {
            const dist = parseFloat(log.distance_driven) || 0;
            const evCost = dist; // The user requested to show Distance Driven as cash for EV Cost
            const petrol = (dist / 16) * 114.27;
            const profit = petrol - evCost;

            sumDistance += dist;
            sumEvCost += evCost;
            sumPetrol += petrol;
            sumProfit += profit;
        });

        const elDist = document.getElementById('global-total-distance');
        const elEv = document.getElementById('global-total-ev-cost');
        const elPetrol = document.getElementById('global-total-petrol');
        const elProfit = document.getElementById('global-total-profit');

        animateValue(elDist, 0, sumDistance, 1500, '', 1);
        animateValue(elEv, 0, sumEvCost, 1500, '₹', 2);
        animateValue(elPetrol, 0, sumPetrol, 1500, '₹', 2);
        animateValue(elProfit, 0, sumProfit, 1500, '₹', 2);

        if (typeof renderDashboardCharts === 'function') {
            renderDashboardCharts();
        } else if (window.renderDashboardCharts) {
            window.renderDashboardCharts();
        }
    }

    function animateValue(obj, start, end, duration, prefix = '', decimals = 2) {
        if (!obj) return;
        // Don't animate if it's already at the target to prevent weird flashes on re-renders
        const currentText = obj.textContent.replace(/[^0-9.]/g, '');
        if (parseFloat(currentText) === end) return;
        
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const current = start + easeProgress * (end - start);
            
            // Format number with Indian commas
            const formatted = current.toLocaleString('en-IN', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
            obj.textContent = prefix + formatted;
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                const finalFormatted = end.toLocaleString('en-IN', {
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals
                });
                obj.textContent = prefix + finalFormatted;
            }
        };
        window.requestAnimationFrame(step);
    }



    function updateTotals(filteredLogs = logs) {
        if (filteredLogs.length === 0) {
            document.getElementById('total-distance').textContent = '0 km';
            document.getElementById('total-ev-cost').textContent = '₹0.00';
            document.getElementById('total-petrol').textContent = '₹0.00';
            document.getElementById('total-profit').textContent = '₹0.00';
            return;
        }

        let sumDistance = 0;
        let sumEvCost = 0;
        let sumPetrol = 0;
        let sumProfit = 0;

        filteredLogs.forEach(log => {
            const dist = parseFloat(log.distance_driven) || 0;
            const chargeRange = parseFloat(log.post_charge_range) || 0;
            const remRange = parseFloat(log.remaining_range) || 0;
            const evCost = dist; // The user requested to show Distance Driven as cash for EV Cost
            const petrol = (dist / 16) * 114.27;
            const profit = petrol - evCost;

            sumDistance += dist;
            sumEvCost += evCost;
            sumPetrol += petrol;
            sumProfit += profit;
        });

        document.getElementById('total-distance').textContent = sumDistance.toFixed(1) + ' km';
        document.getElementById('total-ev-cost').textContent = '₹' + sumEvCost.toFixed(2);
        document.getElementById('total-petrol').textContent = '₹' + sumPetrol.toFixed(2);
        document.getElementById('total-profit').textContent = '₹' + sumProfit.toFixed(2);
    }

    function renderRowContent(tr, log) {
        const isSelected = selectedRows.has(log.id);
        tr.innerHTML = `
            <td class="col-date-cell cell-date" data-field="date" data-type="date" style="position: relative;">
                <div class="row-actions-hover-container" style="position: absolute; right: 100%; top: 50%; transform: translateY(-50%); display: flex; align-items: center; gap: 2px; z-index: 999; padding-right: 12px;">
                    <input type="checkbox" class="row-checkbox" ${isSelected ? 'checked' : ''} style="cursor: pointer; width: 14px; height: 14px; border-radius: 3px; accent-color: var(--text-main); margin-right: 2px;">
                    <button class="row-action-btn add-btn" style="background: transparent; border: none; cursor: pointer; color: var(--text-muted); padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" title="Add row">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                    <button class="row-action-btn delete-btn" data-action="delete" style="background: transparent; border: none; cursor: pointer; color: #ef4444; padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" title="Delete record">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
                ${formatDate(log.date)}
            </td>
            <td class="cell-charge" data-field="post_charge_percentage" data-type="number" data-suffix="%">${formatValue(log.post_charge_percentage, '%')}</td>
            <td class="cell-charge" data-field="post_charge_range" data-type="number" data-suffix=" km">${formatValue(log.post_charge_range, ' km')}</td>
            <td class="cell-charge" data-field="post_charge_mode" data-type="select" data-options="Eco,City,Sport">${formatBadge(log.post_charge_mode)}</td>
            <td class="cell-charge" data-field="post_charge_level" data-type="select" data-options="L1,L2,L3">${formatBadge(log.post_charge_level)}</td>
            
            <td class="cell-drive" data-field="post_drive_mode" data-type="select" data-options="Eco,City,Sport">${formatBadge(log.post_drive_mode)}</td>
            <td class="cell-drive" data-field="post_drive_level" data-type="select" data-options="L1,L2,L3">${formatBadge(log.post_drive_level)}</td>
            <td class="cell-drive" data-field="post_drive_avg_energy_consumption" data-type="number" data-suffix=" Wh/km">${formatValue(log.post_drive_avg_energy_consumption, ' Wh/km')}</td>
            <td class="cell-drive" data-field="remaining_range" data-type="number" data-suffix=" km">${formatValue(log.remaining_range, ' km')}</td>
            <td class="cell-drive" data-field="distance_driven" data-type="number" data-suffix=" km">${formatValue(log.distance_driven, ' km')}</td>
            <td class="cell-drive" data-field="remaining_percentage" data-type="number" data-suffix="%">${formatValue(log.remaining_percentage, '%')}</td>
            
            <td class="cell-calc col-calculated">${formatCalculatedDriveStatus(log)}</td>
            <td class="cell-calc col-calculated">${formatCalculatedTotalRange(log)}</td>
            <td class="cell-calc col-calculated">${formatCalculatedEVCost(log)}</td>
            <td class="cell-calc col-calculated">${formatCalculatedPetrolCost(log)}</td>
            <td class="cell-calc col-calculated">${formatCalculatedProfit(log)}</td>
            
        `;

        // Attach listeners to cells
        Array.from(tr.querySelectorAll('td[data-field]')).forEach(td => {
            td.addEventListener('click', (e) => {
                // Don't trigger if clicking inside an already active input or action container
                if (e.target.tagName === 'INPUT' || e.target.closest('.custom-dropdown') || e.target.closest('.row-actions-hover-container')) return;

                const id = parseInt(tr.dataset.id);
                const field = td.dataset.field;
                const type = td.dataset.type;
                startEditing(id, field, td, type);
            });
        });

        // Attach listener to checkbox
        const checkbox = tr.querySelector('.row-checkbox');
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    selectedRows.add(log.id);
                    tr.classList.add('selected');
                } else {
                    selectedRows.delete(log.id);
                    tr.classList.remove('selected');
                }
                updateMultiSelectUI();
            });
        }

        // Attach listener to add button
        const addBtn = tr.querySelector('.add-btn');
        if (addBtn) {
            addBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (btnAddRecord) btnAddRecord.click();
            });
        }

        // Attach listener to delete button
        const delBtn = tr.querySelector('.delete-btn');
        if (delBtn) {
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (selectedRows.size > 0 && selectedRows.has(log.id)) {
                    bulkDeleteMode = true;
                    openDialog(null);
                } else {
                    bulkDeleteMode = false;
                    openDialog(log.id);
                }
            });
        }
    }

    // --- Inline Editing ---

    function startEditing(id, field, td, type) {
        if (editingCell) {
            finishEditing(true); // Save previous
        }

        // The row might have been re-rendered by finishEditing, detaching our original td.
        // Fetch the fresh td from the DOM to be safe.
        const tr = document.querySelector(`tr[data-id="${id}"]`);
        if (tr) {
            const freshTd = tr.querySelector(`td[data-field="${field}"]`);
            if (freshTd) td = freshTd;
        }

        const log = logs.find(l => l.id === id);
        if (!log) return;

        let currentValue = log[field];
        if (currentValue === null || currentValue === undefined) currentValue = '';

        editingCell = { id, field, td, type, originalValue: currentValue };

        if (type === 'select') {
            const options = td.dataset.options.split(',');
            renderSelectDropdown(td, options, currentValue);
        } else {
            const input = document.createElement('input');
            input.type = type === 'date' ? 'date' : 'number';
            if (type === 'number') {
                input.step = 'any';
            }
            input.className = 'cell-input';
            input.value = currentValue;

            // Clear contents and add input
            td.innerHTML = '';
            td.appendChild(input);
            input.focus();

            // Handle key presses
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    finishEditing(true);
                } else if (e.key === 'Escape') {
                    finishEditing(false);
                }
            });
        }
    }

    function renderSelectDropdown(td, options, currentValue) {
        td.innerHTML = '';

        // Render current badge temporarily
        td.appendChild(createBadgeElement(currentValue || 'Select'));

        const dropdown = document.createElement('div');
        dropdown.className = 'custom-dropdown';

        options.forEach(opt => {
            const optionEl = document.createElement('div');
            optionEl.className = 'dropdown-option';
            optionEl.appendChild(createBadgeElement(opt));

            optionEl.addEventListener('click', (e) => {
                e.stopPropagation();
                if (editingCell) {
                    editingCell.newValue = opt;
                    finishEditing(true);
                }
            });
            dropdown.appendChild(optionEl);
        });

        td.classList.add('custom-select-wrapper');
        td.appendChild(dropdown);
    }

    function finishEditing(save) {
        if (!editingCell) return;

        const { id, field, td, type, originalValue } = editingCell;
        let newValue;

        if (type === 'select') {
            newValue = editingCell.newValue !== undefined ? editingCell.newValue : originalValue;
            td.classList.remove('custom-select-wrapper');
        } else {
            const input = td.querySelector('input');
            newValue = input ? input.value : originalValue;

            if (type === 'number' && newValue !== '') {
                newValue = parseFloat(newValue);
                // Floor energy consumption
                if (field.includes('avg_energy_consumption')) {
                    newValue = Math.floor(newValue);
                }
            }
            if (newValue === '') newValue = null;
        }

        editingCell = null;

        // If value changed, trigger update
        if (save && String(newValue) !== String(originalValue)) {
            const updates = { [field]: newValue };
            updateLog(id, updates);
        } else {
            // Restore display
            const log = logs.find(l => l.id === id);
            if (log) renderRowContent(td.parentElement, log);
        }
    }

    // --- Formatters ---

    function formatDate(dateStr) {
        if (!dateStr) return '<span class="empty-cell">Empty</span>';
        try {
            const d = new Date(dateStr);
            return `<span class="value-display">${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>`;
        } catch {
            return dateStr;
        }
    }

    function formatValue(val, suffix = '') {
        if (val === null || val === undefined) return '<span class="empty-cell">-</span>';

        // If it's energy consumption, floor it just in case
        if (suffix === '' && typeof val === 'number') {
            // Try to detect if it's integer field but value could be float
            // For now, API handles it, just display
        }

        return `<span class="value-display">${val}${suffix}</span>`;
    }

    function formatBadge(val) {
        if (!val) return '<span class="empty-cell">-</span>';
        return createBadgeElement(val).outerHTML;
    }

    function createBadgeElement(val) {
        const span = document.createElement('span');
        span.className = `badge badge-${val}`;
        span.textContent = val;
        return span;
    }

    function formatCalculatedEVCost(log) {
        if (log.distance_driven === null || log.distance_driven === undefined) {
            return '<span class="empty-cell">-</span>';
        }
        return `<span class="value-display calc-value text-blue">₹${log.distance_driven.toFixed(2)}</span>`;
    }

    function formatCalculatedPetrolCost(log) {
        if (log.distance_driven === null || log.distance_driven === undefined) {
            return '<span class="empty-cell">-</span>';
        }
        const cost = (log.distance_driven / 16) * 114.27;
        return `<span class="value-display calc-value">₹${cost.toFixed(2)}</span>`;
    }

    function formatCalculatedProfit(log) {
        if (log.distance_driven === null || log.distance_driven === undefined) {
            return '<span class="empty-cell">-</span>';
        }
        const evCost = log.distance_driven;
        const petrol = (log.distance_driven / 16) * 114.27;
        const profit = petrol - evCost;
        return `<span class="value-display calc-value text-purple">₹${profit.toFixed(2)}</span>`;
    }

    function formatCalculatedTotalRange(log) {
        const distance = parseFloat(log.distance_driven);
        const remaining = parseFloat(log.remaining_range);
        const chargeRange = parseFloat(log.post_charge_range);
        if (isNaN(distance) || isNaN(remaining)) return '<span class="empty-cell">-</span>';
        
        const total = distance + remaining;
        let colorClass = '';
        
        if (!isNaN(chargeRange)) {
            if (total < chargeRange) {
                colorClass = 'text-red';
            } else if (total > chargeRange) {
                colorClass = 'text-green';
            }
        }
        
        return `<span class="value-display calc-value ${colorClass}">${total.toFixed(1)} km</span>`;
    }

    function formatCalculatedDriveStatus(log) {
        const val = parseFloat(log.post_drive_avg_energy_consumption);
        if (isNaN(val)) return '<span class="empty-cell">-</span>';

        let status = '';
        if (val < 120) status = 'Good';
        else if (val <= 140) status = 'Average';
        else status = 'Bad';

        return `<span class="badge badge-${status}">${status}</span>`;
    }

    // --- Dialogs & Toasts ---

    function openDialog(id) {
        if (!bulkDeleteMode) {
            logToDelete = parseInt(id);
            document.querySelector('.dialog-title').textContent = "Delete this charging record?";
        } else {
            document.querySelector('.dialog-title').textContent = `Delete ${selectedRows.size} records?`;
        }
        dialogOverlay.classList.remove('hidden');
    }

    function closeDialog() {
        logToDelete = null;
        bulkDeleteMode = false;
        dialogOverlay.classList.add('hidden');
    }

    async function confirmDelete() {
        if (bulkDeleteMode) {
            for (let id of selectedRows) {
                await deleteLog(id, true);
            }
            selectedRows.clear();
            renderTable();
            updateMultiSelectUI();
            showToast('Records deleted successfully');
            closeDialog();
        } else if (logToDelete) {
            deleteLog(logToDelete);
            closeDialog();
        }
    }

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = 'toast';

        // Add icon based on type
        let icon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        if (type === 'error') {
            icon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
            toast.style.backgroundColor = '#ef4444';
        } else if (type === 'info') {
            icon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
            toast.style.backgroundColor = '#3b82f6';
        }

        toast.innerHTML = `${icon} ${message}`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }

    // --- Export ---

    function exportToCSV() {
        if (logs.length === 0) {
            showToast('No data to export', 'info');
            return;
        }

        const headers = [
            'Date', 'Post-Charge Percentage', 'Post-Charge Avg Energy Cons.', 'Post-Charge Range', 'Post-Charge Mode', 'Post-Charge Level',
            'Post-Drive Mode', 'Post-Drive Level', 'Post-Drive Avg Energy Cons.', 'Remaining Range', 'Distance Driven', 'Remaining Percentage',
            'Drive Status', 'Total Range (km)', 'Range Drop', 'EV Cost (₹)', 'Petrol Savings (₹)', 'Profit (₹)'
        ];

        const csvContent = [
            headers.join(','),
            ...logs.map(log => {
                const drop = (log.post_charge_range !== null && log.remaining_range !== null) ? (log.post_charge_range - log.remaining_range).toFixed(1) : '';
                const evCost = log.distance_driven !== null ? log.distance_driven.toFixed(2) : '';
                const petrol = log.distance_driven !== null ? ((log.distance_driven / 16) * 114.27).toFixed(2) : '';
                const profit = log.distance_driven !== null ? (((log.distance_driven / 16) * 114.27) - log.distance_driven).toFixed(2) : '';

                let driveStatus = '';
                const val = parseFloat(log.post_drive_avg_energy_consumption);
                if (!isNaN(val)) {
                    if (val < 120) driveStatus = 'Good';
                    else if (val <= 140) driveStatus = 'Average';
                    else driveStatus = 'Bad';
                }

                return [
                    log.date || '',
                    log.post_charge_percentage || '',
                    log.post_charge_avg_energy_consumption || '',
                    log.post_charge_range || '',
                    log.post_charge_mode || '',
                    log.post_charge_level || '',
                    log.post_drive_mode || '',
                    log.post_drive_level || '',
                    log.post_drive_avg_energy_consumption || '',
                    log.remaining_range || '',
                    log.distance_driven || '',
                    log.remaining_percentage || '',
                    driveStatus,
                    drop,
                    evCost,
                    petrol,
                    profit
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `car_battery_logs_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // --- Local Tables Logic (Service, Tyre, Issues, Additional) ---
    const localConfigs = {
        'tbody-service': { key: 'ev_svc', cols: ['date', 'odo', 'center', 'cost', 'notes'] },
        'tbody-tyre': { key: 'ev_tyre', cols: ['date', 'odo', 'brand', 'pos', 'cost'] },
        'tbody-issues': { key: 'ev_iss', cols: ['date', 'type', 'sev', 'status', 'notes'] },
        'tbody-additional': { key: 'ev_add', cols: ['date', 'type', 'prov', 'cost', 'notes'] }
    };

    function loadLocalTables() {
        Object.keys(localConfigs).forEach(target => {
            renderLocalTable(target);
        });
    }

    function renderLocalTable(target, filterText = "") {
        const tbody = document.getElementById(target);
        const emptyState = document.getElementById(target.replace('tbody', 'empty'));
        if (!tbody) return;

        const config = localConfigs[target];
        let data = JSON.parse(localStorage.getItem(config.key) || '[]');

        if (filterText) {
            filterText = filterText.toLowerCase();
            data = data.filter(row => Object.values(row).join(' ').toLowerCase().includes(filterText));
        }

        tbody.innerHTML = '';

        if (data.length === 0 && !filterText) {
            if (emptyState) emptyState.classList.remove('hidden');
            tbody.closest('table').nextElementSibling?.classList.remove('hidden'); // if table foot has hidden? wait, no table-foot is static.
        } else {
            if (emptyState) emptyState.classList.add('hidden');
            data.forEach(row => {
                const tr = document.createElement('tr');
                config.cols.forEach(col => {
                    const td = document.createElement('td');
                    td.contentEditable = true;
                    td.className = 'cell-input';
                    td.style.padding = '12px';
                    td.textContent = row[col] || '';
                    td.addEventListener('blur', (e) => {
                        row[col] = e.target.textContent;
                        saveLocalData(config.key, data);
                        showToast('Saved dynamically', 'success');
                    });
                    tr.appendChild(td);
                });
                const actionTd = document.createElement('td');
                actionTd.style.padding = '12px';
                actionTd.innerHTML = `<button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem; color: #ef4444; border-color: #ef4444;">Delete</button>`;
                actionTd.querySelector('button').addEventListener('click', () => {
                    if (confirm('Delete this record?')) {
                        let fullData = JSON.parse(localStorage.getItem(config.key) || '[]');
                        fullData = fullData.filter(r => r.id !== row.id);
                        saveLocalData(config.key, fullData);
                        renderLocalTable(target);
                        showToast('Record deleted');
                    }
                });
                tr.appendChild(actionTd);
                tbody.appendChild(tr);
            });
        }
    }

    function saveLocalData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    document.querySelectorAll('.btn-local-add').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget.getAttribute('data-target');
            const config = localConfigs[target];
            let data = JSON.parse(localStorage.getItem(config.key) || '[]');

            const newRow = { id: Date.now() };
            // Auto fill date with today
            const today = new Date().toISOString().split('T')[0];
            config.cols.forEach(c => newRow[c] = (c === 'date') ? today : '');

            data.push(newRow); // add to bottom
            saveLocalData(config.key, data);
            renderLocalTable(target);
            showToast('New record added', 'success');
        });
    });

    document.querySelectorAll('.local-search').forEach(input => {
        input.addEventListener('input', (e) => {
            const target = e.currentTarget.getAttribute('data-target');
            renderLocalTable(target, e.target.value);
        });
    });

    loadLocalTables();

    // --- Dashboard Charts (Chart.js) ---
    let distanceChartInstance = null;
    let efficiencyChartInstance = null;

    function renderDashboardCharts() {
        if (!logs || logs.length === 0) return;

        // Sort logs by date ascending for charts
        const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));

        // Take the last 14 logs for trend lines
        const recentLogs = sortedLogs.slice(-14);
        const labels = recentLogs.map(l => l.date ? l.date.substring(5) : '');
        const distances = recentLogs.map(l => parseFloat(l.distance_driven) || 0);

        const efficiencies = recentLogs.map(l => {
            const dist = parseFloat(l.distance_driven) || 0;
            const kwh = parseFloat(l.total_kwh) || 0;
            return kwh > 0 ? (dist / kwh).toFixed(2) : 0;
        });

        // 1. Daily Distance Chart
        const ctxDist = document.getElementById('distanceTrendChart');
        if (ctxDist) {
            let chart1 = Chart.getChart("distanceTrendChart");
            if (chart1) chart1.destroy();
            window.distanceChartInstance = new Chart(ctxDist, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Distance (km)',
                        data: distances,
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        // 2. Efficiency Chart (km/kWh)
        const ctxEff = document.getElementById('efficiencyTrendChart');
        if (ctxEff) {
            let chart2 = Chart.getChart("efficiencyTrendChart");
            if (chart2) chart2.destroy();
            window.efficiencyChartInstance = new Chart(ctxEff, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Efficiency (km/kWh)',
                        data: efficiencies,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }
        
        // 3. Profit Overview Chart (Cost vs Profit)
        const ctxProfit = document.getElementById('profitOverviewChart');
        if (ctxProfit) {
            let chart3 = Chart.getChart("profitOverviewChart");
            if (chart3) chart3.destroy();
            
            const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const currentMonthIndex = new Date().getMonth();
            const dynLabels = allMonths.slice(0, currentMonthIndex + 1);
            
            const dynEv = new Array(currentMonthIndex + 1).fill(0);
            const dynPetrol = new Array(currentMonthIndex + 1).fill(0);
            const dynProfit = new Array(currentMonthIndex + 1).fill(0);
            
            const currentYear = new Date().getFullYear();
            
            logs.forEach(log => {
                const d = new Date(log.date);
                if (d.getFullYear() === currentYear) {
                    const m = d.getMonth();
                    if (m <= currentMonthIndex) {
                        const dist = parseFloat(log.distance_driven) || 0;
                        const evC = dist; 
                        const petC = (dist / 16) * 114.27;
                        
                        dynEv[m] += evC;
                        dynPetrol[m] += petC;
                        dynProfit[m] += (petC - evC);
                    }
                }
            });
            
            window.profitChartInstance = new Chart(ctxProfit, {
                type: 'line',
                data: {
                    labels: dynLabels,
                    datasets: [
                        {
                            label: 'Total Profit (₹)',
                            data: dynProfit,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Petrol Equiv. (₹)',
                            data: dynPetrol,
                            borderColor: '#ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'EV Cost (₹)',
                            data: dynEv,
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { 
                            position: 'bottom',
                            labels: {
                                boxWidth: 12,
                                usePointStyle: true,
                                color: 'rgba(148, 163, 184, 0.8)'
                            }
                        } 
                    },
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }
    }

    // Expose renderDashboardCharts to global scope so updateGlobalTotals can call it if needed, or call it directly.
    window.renderDashboardCharts = renderDashboardCharts;
});
