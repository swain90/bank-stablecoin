const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@daml.js/40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7': path.resolve(__dirname, 'src/daml.js/40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7'),
      '@daml.js/d14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662': path.resolve(__dirname, 'src/daml.js/d14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662'),
    },
  },
};