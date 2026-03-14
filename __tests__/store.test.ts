import { describe, it, expect, beforeEach } from 'vitest'
import { useCityStore } from '@/store/city-store'

// Reset store state before each test
beforeEach(() => {
  useCityStore.setState({
    buildings: [],
    tokens: 0,
    lastVisitAt: null,
    spawnTimestamps: [],
    prosperityValue: 0,
  })
})

describe('spawnBuilding', () => {
  it('adds a building to the city', () => {
    const { spawnBuilding } = useCityStore.getState()
    spawnBuilding('flower-shop', 100, 'jupiter')
    const state = useCityStore.getState()
    expect(state.buildings).toHaveLength(1)
    expect(state.buildings[0].type).toBe('flower-shop')
    expect(state.buildings[0].totalValue).toBe(100)
    expect(state.buildings[0].yieldSource).toBe('jupiter')
  })

  it('updates prosperityValue after spawn', () => {
    useCityStore.getState().spawnBuilding('flower-shop', 200, 'jupiter')
    expect(useCityStore.getState().prosperityValue).toBe(200)
  })

  it('records spawn timestamp', () => {
    useCityStore.getState().spawnBuilding('pet-shop', 100, 'voltr')
    expect(useCityStore.getState().spawnTimestamps).toHaveLength(1)
  })

  it('calculates initial level correctly', () => {
    useCityStore.getState().spawnBuilding('bookshop', 200, 'jupiter')
    expect(useCityStore.getState().buildings[0].level).toBe(2)
  })
})

describe('upgradeBuilding', () => {
  it('increases totalValue and depositValue', () => {
    useCityStore.getState().spawnBuilding('flower-shop', 100, 'jupiter')
    const id = useCityStore.getState().buildings[0].id
    useCityStore.getState().upgradeBuilding(id, 100)
    const building = useCityStore.getState().buildings[0]
    expect(building.totalValue).toBe(200)
    expect(building.depositValue).toBe(200)
  })

  it('upgrades level when threshold is crossed', () => {
    useCityStore.getState().spawnBuilding('flower-shop', 100, 'jupiter')
    const id = useCityStore.getState().buildings[0].id
    useCityStore.getState().upgradeBuilding(id, 100)
    expect(useCityStore.getState().buildings[0].level).toBe(2)
  })

  it('cancels wilting on re-deposit above minimum', () => {
    useCityStore.getState().spawnBuilding('flower-shop', 100, 'jupiter')
    const id = useCityStore.getState().buildings[0].id
    // Set wilting manually
    useCityStore.setState(state => ({
      buildings: state.buildings.map(b =>
        b.id === id ? { ...b, status: 'wilting', wiltingStartedAt: Date.now(), totalValue: 50 } : b
      ),
    }))
    useCityStore.getState().upgradeBuilding(id, 100)
    const building = useCityStore.getState().buildings[0]
    expect(building.status).toBe('active')
    expect(building.wiltingStartedAt).toBeNull()
  })
})

describe('mergeBuildings', () => {
  it('combines two buildings into one with next level', () => {
    useCityStore.getState().spawnBuilding('flower-shop', 100, 'jupiter')
    useCityStore.getState().spawnBuilding('flower-shop', 100, 'jupiter')
    const state = useCityStore.getState()
    const [idA, idB] = state.buildings.map(b => b.id)
    useCityStore.getState().mergeBuildings(idA, idB)
    const newState = useCityStore.getState()
    expect(newState.buildings).toHaveLength(1)
    expect(newState.buildings[0].level).toBe(2)
    expect(newState.buildings[0].totalValue).toBe(200)
  })

  it('preserves yieldSource from first building', () => {
    useCityStore.getState().spawnBuilding('flower-shop', 100, 'jupiter')
    useCityStore.getState().spawnBuilding('flower-shop', 100, 'voltr')
    const [idA, idB] = useCityStore.getState().buildings.map(b => b.id)
    useCityStore.getState().mergeBuildings(idA, idB)
    expect(useCityStore.getState().buildings[0].yieldSource).toBe('jupiter')
  })

  it('updates prosperityValue correctly after merge', () => {
    useCityStore.getState().spawnBuilding('flower-shop', 150, 'jupiter')
    useCityStore.getState().spawnBuilding('flower-shop', 150, 'jupiter')
    const [idA, idB] = useCityStore.getState().buildings.map(b => b.id)
    useCityStore.getState().mergeBuildings(idA, idB)
    expect(useCityStore.getState().prosperityValue).toBe(300)
  })
})

describe('withdrawFull', () => {
  it('sets building status to wilting', () => {
    useCityStore.getState().spawnBuilding('flower-shop', 100, 'jupiter')
    const id = useCityStore.getState().buildings[0].id
    useCityStore.getState().withdrawFull(id)
    const building = useCityStore.getState().buildings[0]
    expect(building.status).toBe('wilting')
    expect(building.wiltingStartedAt).not.toBeNull()
  })
})

describe('withdrawPartial', () => {
  it('reduces totalValue and depositValue', () => {
    useCityStore.getState().spawnBuilding('flower-shop', 200, 'jupiter')
    const id = useCityStore.getState().buildings[0].id
    useCityStore.getState().withdrawPartial(id, 50)
    const building = useCityStore.getState().buildings[0]
    expect(building.totalValue).toBe(150)
  })

  it('triggers wilting when value drops below minimum', () => {
    useCityStore.getState().spawnBuilding('flower-shop', 120, 'jupiter')
    const id = useCityStore.getState().buildings[0].id
    useCityStore.getState().withdrawPartial(id, 50)
    const building = useCityStore.getState().buildings[0]
    expect(building.status).toBe('wilting')
  })

  it('downgrades level when value drops but stays above minimum', () => {
    useCityStore.getState().spawnBuilding('flower-shop', 800, 'jupiter')
    const id = useCityStore.getState().buildings[0].id
    useCityStore.getState().withdrawPartial(id, 600)
    expect(useCityStore.getState().buildings[0].totalValue).toBe(200)
    expect(useCityStore.getState().buildings[0].level).toBe(2)
  })

  it('triggers wilting when value drops below minimum', () => {
    useCityStore.getState().spawnBuilding('flower-shop', 200, 'jupiter')
    const id = useCityStore.getState().buildings[0].id
    useCityStore.getState().withdrawPartial(id, 110)
    expect(useCityStore.getState().buildings[0].status).toBe('wilting')
  })
})

describe('collectRent', () => {
  it('converts uncollectedYield to tokens', () => {
    useCityStore.getState().spawnBuilding('flower-shop', 100, 'jupiter')
    const id = useCityStore.getState().buildings[0].id
    useCityStore.setState(state => ({
      buildings: state.buildings.map(b =>
        b.id === id ? { ...b, uncollectedYield: 1.5 } : b
      ),
    }))
    useCityStore.getState().collectRent(id)
    expect(useCityStore.getState().tokens).toBe(15)
    expect(useCityStore.getState().buildings[0].uncollectedYield).toBe(0)
  })
})

describe('updateBuildingYield + confirmLevelUp', () => {
  it('increases totalValue and yieldEarned', () => {
    useCityStore.getState().spawnBuilding('flower-shop', 100, 'jupiter')
    const id = useCityStore.getState().buildings[0].id
    useCityStore.getState().updateBuildingYield(id, 50)
    const building = useCityStore.getState().buildings[0]
    expect(building.totalValue).toBe(150)
    expect(building.yieldEarned).toBe(50)
    expect(building.uncollectedYield).toBe(50)
  })

  it('sets pendingLevelUp when threshold is crossed', () => {
    useCityStore.getState().spawnBuilding('flower-shop', 100, 'jupiter')
    const id = useCityStore.getState().buildings[0].id
    useCityStore.getState().updateBuildingYield(id, 100)
    expect(useCityStore.getState().buildings[0].pendingLevelUp).toBe(true)
  })

  it('confirmLevelUp updates level and clears pendingLevelUp', () => {
    useCityStore.getState().spawnBuilding('flower-shop', 100, 'jupiter')
    const id = useCityStore.getState().buildings[0].id
    useCityStore.getState().updateBuildingYield(id, 100)
    useCityStore.getState().confirmLevelUp(id)
    const building = useCityStore.getState().buildings[0]
    expect(building.level).toBe(2)
    expect(building.pendingLevelUp).toBe(false)
  })
})

describe('removeExpiredBuildings', () => {
  it('removes buildings that have been wilting longer than grace period', () => {
    useCityStore.getState().spawnBuilding('flower-shop', 100, 'jupiter')
    const id = useCityStore.getState().buildings[0].id
    const expiredTime = Date.now() - 25 * 60 * 60 * 1000 // 25 hours ago
    useCityStore.setState(state => ({
      buildings: state.buildings.map(b =>
        b.id === id ? { ...b, status: 'wilting', wiltingStartedAt: expiredTime } : b
      ),
    }))
    useCityStore.getState().removeExpiredBuildings()
    expect(useCityStore.getState().buildings).toHaveLength(0)
  })

  it('keeps buildings wilting within the grace period', () => {
    useCityStore.getState().spawnBuilding('flower-shop', 100, 'jupiter')
    const id = useCityStore.getState().buildings[0].id
    useCityStore.setState(state => ({
      buildings: state.buildings.map(b =>
        b.id === id ? { ...b, status: 'wilting', wiltingStartedAt: Date.now() - 1000 } : b
      ),
    }))
    useCityStore.getState().removeExpiredBuildings()
    expect(useCityStore.getState().buildings).toHaveLength(1)
  })
})

describe('cancel wilting on re-deposit', () => {
  it('re-activates a wilting building when upgraded above minimum', () => {
    useCityStore.getState().spawnBuilding('flower-shop', 100, 'jupiter')
    const id = useCityStore.getState().buildings[0].id
    // Force into wilting state with low value
    useCityStore.setState(state => ({
      buildings: state.buildings.map(b =>
        b.id === id
          ? { ...b, status: 'wilting', wiltingStartedAt: Date.now(), totalValue: 30, depositValue: 30 }
          : b
      ),
    }))
    useCityStore.getState().upgradeBuilding(id, 100)
    const building = useCityStore.getState().buildings[0]
    expect(building.status).toBe('active')
    expect(building.wiltingStartedAt).toBeNull()
  })
})
