"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupIntegratedWorkspace = void 0;
const child_process_1 = require("child_process");
const package_manager_1 = require("../../../../utils/package-manager");
function setupIntegratedWorkspace() {
    const pmc = (0, package_manager_1.getPackageManagerCommand)();
    (0, child_process_1.execSync)(`${pmc.exec} nx g @nx/angular:ng-add`, { stdio: [0, 1, 2] });
}
exports.setupIntegratedWorkspace = setupIntegratedWorkspace;
