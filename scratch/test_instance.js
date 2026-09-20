// Mock browser globals
global.window = global;
global.window.addEventListener = () => {};
global.document = {
    addEventListener: () => {},
    createElement: () => ({ style: {} }),
    body: { appendChild: () => {} }
};
global.navigator = { onLine: true };
global.URL = { createObjectURL: () => '', revokeObjectURL: () => {} };
global.MadrassahDB = {};

require('../app.js');

if (window.app) {
    console.log('window.app successfully instantiated!');
    console.log('currentView:', window.app.currentView);
    console.log('currentSection:', window.app.currentSection);
    console.log('All modules loaded cleanly!');
} else {
    console.error('window.app was not instantiated!');
    process.exit(1);
}
