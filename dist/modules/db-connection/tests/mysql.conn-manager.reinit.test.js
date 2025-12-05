"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Mock mysql2/promise to avoid real DB connections
const mockCreatePool = jest.fn();
// A simple helper to build a mocked pool
function buildMockPool(label) {
    const listeners = { acquire: [], connection: [], release: [], enqueue: [] };
    return {
        label,
        on: jest.fn((event, cb) => {
            (listeners[event] = listeners[event] || []).push(cb);
        }),
        end: jest.fn(async () => { }),
        execute: jest.fn(async () => { }),
        getConnection: jest.fn(async () => ({
            connection: { stream: { readyState: 'open' } },
            release: jest.fn(async () => { })
        }))
    };
}
jest.mock('mysql2/promise', () => ({
    __esModule: true,
    createPool: mockCreatePool
}));
const mysql_conn_manager_1 = require("../mysql-conn-manager");
describe('MySqlConnManager reinitializeConnection (debounce and graceful close)', () => {
    beforeEach(async () => {
        jest.resetAllMocks();
        await mysql_conn_manager_1.MySqlConnManager.getInstance().end('primary');
    });
    afterAll(async () => {
        await mysql_conn_manager_1.MySqlConnManager.getInstance().end('primary');
    });
    it('debounces concurrent reinitializations per identifier', async () => {
        // Arrange: first ensure no existing pool
        mockCreatePool.mockResolvedValueOnce(buildMockPool('debounce-new'));
        // Act: trigger two concurrent reinitializations for same id
        const p1 = mysql_conn_manager_1.MySqlConnManager.getInstance().reinitializeConnection('primary');
        const p2 = mysql_conn_manager_1.MySqlConnManager.getInstance().reinitializeConnection('primary');
        const p3 = mysql_conn_manager_1.MySqlConnManager.getInstance().reinitializeConnection('primary');
        const p4 = mysql_conn_manager_1.MySqlConnManager.getInstance().reinitializeConnection('primary');
        const [res1, res2, res3, res4] = await Promise.all([p1, p2, p3, p4]);
        // Assert: only one pool was created; both calls resolved to same instance
        expect(mockCreatePool).toHaveBeenCalledTimes(1);
        expect(res1).toBe(res2);
        expect(res2).toBe(res3);
        expect(res3).toBe(res4);
    });
    it('closes old pool before creating a new one on reinit', async () => {
        // Arrange: create initial pool via getConnection
        const initialPool = buildMockPool('initial');
        const newPool = buildMockPool('new');
        mockCreatePool
            .mockResolvedValueOnce(initialPool) // for initial getConnection
            .mockResolvedValueOnce(newPool); // for reinit
        // Create initial
        const first = await mysql_conn_manager_1.MySqlConnManager.getInstance().getConnection('primary');
        expect(first).toBe(initialPool);
        // Act: reinitialize
        const reinitResult = await mysql_conn_manager_1.MySqlConnManager.getInstance().reinitializeConnection('primary');
        // Assert: old pool end() called before replacing
        expect(initialPool.end).toHaveBeenCalledTimes(1);
        expect(reinitResult).toBe(newPool);
        expect(mockCreatePool).toHaveBeenCalledTimes(2);
    });
});
//# sourceMappingURL=mysql.conn-manager.reinit.test.js.map