document.addEventListener('DOMContentLoaded', function () {
    // --- DATA ---
    const serviceMethodMap = {
        'S1': { name: 'mfg-order-management-service-api', methods: ['GetCustomerByID', 'UpdateAddressByID', 'UpdateOrder', 'AddOrderPayment', 'GetOrderDetails', 'GetCompList'].map(m => ({ name: m, tags: [] })) },
        'S2': { name: 'mfg-customer-service-api', methods: ['GetSystemTime', 'GetCustomerByID', 'RegisterCustomer', 'UpdateCustomer', 'RegisterAddressByID', 'UpdateAddressByID', 'RegisterCustomerPhoneNumber', 'UpdateCustomerPhoneNumber'].map(m => ({ name: m, tags: [] })) },
        'S3': { name: 'mfg-menu-manager-api', methods: ['GetItem', 'GetModGroupsList', 'GetModifiersList'].map(m => ({ name: m, tags: [] })) },
        'S4': {
            name: 'mfg-bk-api', methods: [
                { name: 'ActiveCustomerAccount', tags: ['grab'] },
                { name: 'GetActiveOrdersList', tags: ['grab'] },
                { name: 'GetCompList', tags: ['grab'] },
                { name: 'GetCustomerByEmail', tags: ['grab'] },
                { name: 'GetCustomerByID', tags: [] },
                { name: 'GetItem', tags: ['lineman', 'grab'] },
                { name: 'GetItemsList', tags: ['grab'] },
                { name: 'GetModGroupsList', tags: ['lineman', 'grab'] },
                { name: 'GetModifiersList', tags: ['lineman', 'grab'] },
                { name: 'GetOrderDetails', tags: ['lineman', 'grab'] },
                { name: 'GetOrderStatusChanges', tags: ['lineman', 'grab'] },
                { name: 'GetStore', tags: ['lineman', 'grab'] },
                { name: 'GetStoresList', tags: ['grab'] },
                { name: 'GetSystemParametersList', tags: ['grab'] },
                { name: 'GetWebBuildTypeList', tags: ['grab'] },
                { name: 'GetZone', tags: ['grab'] },
                { name: 'IsCustomerUserNameOrEmailUsed', tags: [] },
                { name: 'RegisterAddress', tags: ['lineman', 'grab'] },
                { name: 'RegisterCustomer', tags: ['lineman', 'grab'] },
                { name: 'UpdateAddress', tags: ['grab'] },
                { name: 'UpdateOrder', tags: ['lineman', 'grab'] },
                { name: 'ValidateOrder', tags: [] }
            ]
        },
        'S5': { name: 'mfg-tpc-cms', methods: ['GetSystemInfo', 'GetSystemInfo2', 'GetItem', 'GetStores', 'GetStore', 'GetWebDimensionListPart', 'GetCustomerAddresses', 'GetOrderStatusList', 'GetOrderDetails'].map(m => ({ name: m, tags: [] })) },
        'S6': { name: 'mfg-tpc-api', methods: ['GetCustomerByID', 'UpdateCustomer', 'RegisterCustomer', 'GetCustomer', 'ActiveCustomerAccount', 'IsCustomerUserNameOrEmailUsed', 'UpdateCustomerPhoneNumber', 'RegisterCustomerPhoneNumber', 'UpdateOrder', 'AddOrderPayment', 'GetOrderDetails', 'GetActiveOrdersList', 'UpdateAddress', 'GetCustomerAddresses', 'GetWebCitiesList', 'GetWebDistrictsList', 'RegisterAddress', 'UpdateAddressStoreDetails', 'RegisterAddressStoreDetails', 'GetStoreArea', 'GetStore', 'GetCompList', 'GetPromoBogoList', 'GetItem'].map(m => ({ name: m, tags: [] })) },
        'S7': { name: 'mfg-1112d-api', methods: ['GetCustomerByID', 'RegisterAddress', 'UpdateAddress', 'UpdateCustomer', 'UpdateOrder', 'GetOrderDetails', 'GetStore', 'AddOrderPayment', 'GetCompList', 'GetPromoBogoList', 'GetItem', 'GetActiveOrdersList', 'GetCustomerAddresses', 'SendCommand'].map(m => ({ name: m, tags: [] })) }
    };

    const allMethods = {
        'G2': { title: 'Customer Management', methods: ['GetCustomerByID', 'UpdateCustomer', 'RegisterCustomer', 'GetCustomer', 'ActiveCustomerAccount', 'IsCustomerUserNameOrEmailUsed', 'UpdateCustomerPhoneNumber', 'RegisterCustomerPhoneNumber', 'GetCustomerByEmail'] },
        'G5': { title: 'Order Management', methods: ['UpdateOrder', 'AddOrderPayment', 'GetOrderDetails', 'GetActiveOrdersList', 'GetOrderStatusList', 'SendCommand', 'ValidateOrder', 'GetOrderStatusChanges', 'cancelOrder', 'apiGetOrderCreated'] },
        'G4': { title: 'Address Management', methods: ['UpdateAddress', 'GetCustomerAddresses', 'GetWebCitiesList', 'GetWebDistrictsList', 'RegisterAddress', 'UpdateAddressStoreDetails', 'RegisterAddressStoreDetails', 'UpdateAddressByID', 'RegisterAddressByID'] },
        'G3': { title: 'Store & Menu Info', methods: ['GetStoreArea', 'GetStore', 'GetStores', 'GetCompList', 'GetPromoBogoList', 'GetItem', 'GetWebDimensionListPart', 'GetModGroupsList', 'GetModifiersList', 'GetItemsList', 'GetStoresList', 'GetZone', 'GetWebBuildTypeList', 'apiGetStoreBu'] },
        'G1': { title: 'System & Info', methods: ['GetSystemInfo', 'GetSystemInfo2', 'GetSystemTime', 'GetSystemParametersList'] }
    };

    // --- STATE & DOM ELEMENTS ---
    let activeNodeId = null;
    const serviceButtons = document.querySelectorAll('.service-menu button');
    const groupDisplayDiv = document.getElementById('group_display_div');
    const initialMessage = document.getElementById('initial-message');
    const graphContainer = document.getElementById('overview-graph');
    const methodListDisplay = document.getElementById('method-list-display');
    const methodListTitle = document.getElementById('method-list-title');
    const methodListContent = document.getElementById('method-list-content');
    const methodListPlaceholder = document.getElementById('method-list-placeholder');

    /**
     * Debounce function to limit the rate at which a function gets called.
     */
    function debounce(func, delay = 250) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }

    /**
     * Returns Tailwind CSS classes for a given tag.
     */
    function getTagColorClasses(tag) {
        const lowerTag = tag.toLowerCase();
        switch (lowerTag) {
            case 'lineman':
                return 'bg-green-100 text-green-800';
            case 'grab':
                return 'bg-purple-100 text-purple-800';
            case 'shopeefood':
                return 'bg-orange-100 text-orange-800';
            case 'tpc':
                return 'bg-sky-100 text-sky-800';
            default:
                return 'bg-slate-100 text-slate-800';
        }
    }

    /**
     * Clears all selections and resets the view to its initial state.
     */
    function clearSelection() {
        activeNodeId = null;
        // Clear graph highlights
        const svg = graphContainer.querySelector('svg');
        if (svg) {
            svg.querySelectorAll('.highlight-node, .dimmed').forEach(el => el.classList.remove('highlight-node', 'dimmed'));
            svg.querySelectorAll('.highlight-link').forEach(el => el.classList.remove('highlight-link'));
        }
        // Hide right panel
        methodListDisplay.classList.add('opacity-0', 'pointer-events-none');
        // Reset buttons
        serviceButtons.forEach(btn => {
            btn.classList.remove('active-gradient', 'text-white', 'shadow-lg');
            btn.classList.add('bg-slate-100', 'text-slate-700');
            const span = btn.querySelector('span');
            if (span) {
                span.classList.remove('text-slate-200');
                span.classList.add('text-slate-500');
            }
        });
        // Show initial message in bottom panel
        groupDisplayDiv.innerHTML = '';
        groupDisplayDiv.appendChild(initialMessage);
        initialMessage.style.display = 'flex';
    }

    /**
     * Main function to update the entire UI based on a selected node ID.
     */
    function updateSelection(nodeId) {
        if (!nodeId) {
            clearSelection();
            return;
        }

        if (activeNodeId === nodeId) {
            clearSelection();
            return;
        }

        activeNodeId = nodeId;
        const isService = nodeId.startsWith('S');

        // 1. Update Graph Highlights
        const svg = graphContainer.querySelector('svg');
        if (svg) {
            const allNodes = svg.querySelectorAll('.node-text');
            const allLinks = svg.querySelectorAll('.link-path');
            const connectedIds = new Set([nodeId]);

            allLinks.forEach(link => {
                const serviceId = link.dataset.serviceId;
                const groupId = link.dataset.groupId;
                if ((isService && serviceId === nodeId) || (!isService && groupId === nodeId)) {
                    link.classList.add('highlight-link');
                    link.classList.remove('dimmed');
                    connectedIds.add(isService ? groupId : serviceId);
                } else {
                    link.classList.add('dimmed');
                    link.classList.remove('highlight-link');
                }
            });

            allNodes.forEach(node => {
                if (connectedIds.has(node.dataset.id)) {
                    node.classList.add('highlight-node');
                    node.classList.remove('dimmed');
                } else {
                    node.classList.add('dimmed');
                    node.classList.remove('highlight-node');
                }
            });
        }

        // 2. Update Right Method List Panel (only for services)
        if (isService) {
            const serviceData = serviceMethodMap[nodeId];
            let contentHtml = '';
            Object.values(allMethods).forEach(groupData => {
                const relatedMethods = groupData.methods.filter(methodName =>
                    serviceData.methods.some(m => m.name === methodName)
                );
                if (relatedMethods.length > 0) {
                    contentHtml += `
                        <div class="mt-3 first:mt-0">
                            <h5 class="font-semibold text-slate-700 flex justify-between items-center">
                                <span>${groupData.title}</span>
                                <span class="text-xs font-normal bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">${relatedMethods.length}</span>
                            </h5>
                            <ul class="pl-2 mt-1 space-y-1 border-l-2 border-slate-100">
                                ${relatedMethods.map(m => `<li>${m}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                }
            });
            methodListTitle.textContent = serviceData.name;
            methodListContent.innerHTML = contentHtml;
            methodListPlaceholder.classList.add('hidden');
            methodListContent.classList.remove('hidden');
            methodListDisplay.classList.remove('opacity-0', 'pointer-events-none');
        } else {
            methodListDisplay.classList.add('opacity-0', 'pointer-events-none');
        }

        // 3. Update Button Styles and Bottom Details (only if a service was selected)
        if (isService) {
            const button = document.querySelector(`.service-menu button[data-service-id="${nodeId}"]`);
            if (button) {
                updateButtonStyles(button);
                const serviceName = serviceMethodMap[nodeId].name;
                initialMessage.style.display = 'none';
                renderGroups(nodeId, serviceName);
            }
        }
    }

    /**
     * Renders the SVG graph.
     */
    function renderOverviewGraph() {
        const containerRect = graphContainer.getBoundingClientRect();
        if (containerRect.width === 0) return;
        const width = containerRect.width;
        const height = containerRect.height;
        const padding = { top: 20, right: 180, bottom: 20, left: 250 };
        const svgNs = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNs, "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

        const services = Object.entries(serviceMethodMap);
        const groups = Object.entries(allMethods);
        const nodePositions = new Map();

        services.forEach(([id, data], i) => {
            const y = padding.top + i * ((height - padding.top - padding.bottom) / (services.length - 1));
            nodePositions.set(id, { x: padding.left, y: y, name: data.name });
        });
        groups.forEach(([id, data], i) => {
            const y = padding.top + i * ((height - padding.top - padding.bottom) / (groups.length - 1));
            nodePositions.set(id, { x: width - padding.right, y: y, name: data.title });
        });

        const linksGroup = document.createElementNS(svgNs, "g");
        const nodesGroup = document.createElementNS(svgNs, "g");
        svg.appendChild(linksGroup);
        svg.appendChild(nodesGroup);

        services.forEach(([serviceId, serviceData]) => {
            groups.forEach(([groupId, groupData]) => {
                if (groupData.methods.some(methodName => serviceData.methods.some(m => m.name === methodName))) {
                    const p1 = nodePositions.get(serviceId);
                    const p2 = nodePositions.get(groupId);
                    const path = document.createElementNS(svgNs, "path");
                    const d = `M ${p1.x} ${p1.y} C ${p1.x + 100} ${p1.y}, ${p2.x - 100} ${p2.y}, ${p2.x} ${p2.y}`;
                    path.setAttribute("d", d);
                    path.setAttribute("class", "link-path");
                    path.setAttribute("data-service-id", serviceId);
                    path.setAttribute("data-group-id", groupId);
                    linksGroup.appendChild(path);
                }
            });
        });
        nodePositions.forEach((pos, id) => {
            const text = document.createElementNS(svgNs, "text");
            text.setAttribute("x", pos.x);
            text.setAttribute("y", pos.y);
            text.setAttribute("dy", "0.35em");
            text.setAttribute("text-anchor", id.startsWith('S') ? "end" : "start");
            text.setAttribute("class", "node-text fill-slate-600");
            text.setAttribute("data-id", id);
            text.textContent = pos.name;
            nodesGroup.appendChild(text);
        });

        graphContainer.innerHTML = '';
        graphContainer.appendChild(svg);

        svg.querySelectorAll('.node-text').forEach(node => {
            node.addEventListener('click', (event) => {
                event.stopPropagation();
                updateSelection(node.dataset.id);
            });
        });
        svg.addEventListener('click', () => updateSelection(null));
    }

    /**
     * Sets up initial event listeners for buttons.
     */
    function initialize() {
        serviceButtons.forEach(button => {
            button.addEventListener('click', () => {
                updateSelection(button.dataset.serviceId);
            });
        });
    }

    /**
     * Updates only the visual state of service buttons.
     */
    function updateButtonStyles(activeButton) {
        serviceButtons.forEach(btn => {
            btn.classList.remove('active-gradient', 'text-white', 'shadow-lg');
            btn.classList.add('bg-slate-100', 'text-slate-700');
            const span = btn.querySelector('span');
            if (span) {
                span.classList.remove('text-slate-200');
                span.classList.add('text-slate-500');
            }
        });
        activeButton.classList.add('active-gradient', 'text-white', 'shadow-lg');
        const span = activeButton.querySelector('span');
        if (span) {
            span.classList.add('text-slate-200');
        }
    }

    /**
     * Renders the groups in the bottom multi-column layout.
     */
    function renderGroups(serviceId, serviceName) {
        let contentHtml = `<h2 class="col-span-full text-2xl font-bold text-slate-800 mb-2 break-words">${serviceName}</h2>`;
        let groupsFound = false;
        let groupCardsHtml = '';
        const serviceMethods = serviceMethodMap[serviceId].methods;

        Object.values(allMethods).forEach(groupData => {
            const relatedMethods = groupData.methods.filter(methodName =>
                serviceMethods.some(m => m.name === methodName)
            );

            if (relatedMethods.length > 0) {
                groupsFound = true;

                const methodListHtml = serviceMethods
                    .filter(methodObj => relatedMethods.includes(methodObj.name))
                    .map(methodObj => {
                        const tagsHtml = (methodObj.tags && methodObj.tags.length > 0)
                            ? `<div class="mt-2 flex flex-wrap items-center gap-1.5">${methodObj.tags.map(tag => {
                                const tagColorClasses = getTagColorClasses(tag);
                                return `<span class="text-xs font-medium ${tagColorClasses} px-2 py-0.5 rounded-full">${tag}</span>`;
                            }).join('')}</div>`
                            : '';

                        return `<li class="py-3">
                            <span class="text-slate-600 text-sm">${methodObj.name}()</span>
                            ${tagsHtml}
                        </li>`;
                    }).join('');

                groupCardsHtml += `
                    <div class="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <h3 class="font-semibold text-indigo-600 mb-3 flex justify-between items-center">
                            <span>${groupData.title}</span>
                            <span class="text-xs font-normal bg-indigo-100 text-indigo-600 rounded-full px-2 py-0.5">${relatedMethods.length} Methods</span>
                        </h3>
                        <ul class="space-y-0 divide-y divide-slate-200">
                            ${methodListHtml}
                        </ul>
                    </div>
                `;
            }
        });

        if (!groupsFound) {
            contentHtml += `<p class="col-span-full text-slate-400">No method groups found for this service.</p>`;
        } else {
            contentHtml += `<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">${groupCardsHtml}</div>`;
        }
        groupDisplayDiv.innerHTML = contentHtml;
    }

    // --- INITIALIZATION ---
    renderOverviewGraph();
    initialize();
    updateSelection('S4'); // Set default selection to mfg-bk-api to show the change

    window.addEventListener('resize', debounce(renderOverviewGraph, 200));
});