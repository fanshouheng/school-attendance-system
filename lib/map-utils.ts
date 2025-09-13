// 地图工具函数

/**
 * 计算两点之间的距离（使用Haversine公式）
 * @param lat1 第一个点的纬度
 * @param lng1 第一个点的经度
 * @param lat2 第二个点的纬度
 * @param lng2 第二个点的经度
 * @returns 距离（米）
 */
export function calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371e3 // 地球半径（米）
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lng2 - lng1) * Math.PI) / 180

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
}

/**
 * 格式化距离显示
 * @param distance 距离（米）
 * @returns 格式化的距离字符串
 */
export function formatDistance(distance: number): string {
    if (distance < 1000) {
        return `${Math.round(distance)}米`
    } else {
        return `${(distance / 1000).toFixed(1)}公里`
    }
}

/**
 * 获取导航URL
 * @param lat 目标纬度
 * @param lng 目标经度
 * @param name 目标名称
 * @returns 高德地图导航URL
 */
export function getNavigationUrl(lat: number, lng: number, name: string): string {
    // 高德地图导航URL
    return `https://uri.amap.com/navigation?to=${lng},${lat},${encodeURIComponent(name)}&mode=car&policy=1&src=myapp&coordinate=gaode&callnative=0`
}

/**
 * 获取步行导航URL
 * @param lat 目标纬度
 * @param lng 目标经度
 * @param name 目标名称
 * @returns 高德地图步行导航URL
 */
export function getWalkingNavigationUrl(lat: number, lng: number, name: string): string {
    return `https://uri.amap.com/navigation?to=${lng},${lat},${encodeURIComponent(name)}&mode=walk&src=myapp&coordinate=gaode&callnative=0`
}

/**
 * 根据距离排序学校
 * @param schools 学校列表
 * @param userLat 用户纬度
 * @param userLng 用户经度
 * @returns 按距离排序的学校列表
 */
export function sortSchoolsByDistance<T extends { lat: number; lng: number }>(
    schools: T[],
    userLat: number,
    userLng: number
): (T & { distance: number })[] {
    return schools
        .map(school => ({
            ...school,
            distance: calculateDistance(userLat, userLng, school.lat, school.lng)
        }))
        .sort((a, b) => a.distance - b.distance)
}

/**
 * 检查位置是否在指定范围内
 * @param lat1 第一个点的纬度
 * @param lng1 第一个点的经度
 * @param lat2 第二个点的纬度
 * @param lng2 第二个点的经度
 * @param radius 范围半径（米）
 * @returns 是否在范围内
 */
export function isWithinRadius(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
    radius: number
): boolean {
    const distance = calculateDistance(lat1, lng1, lat2, lng2)
    return distance <= radius
}

/**
 * 获取地图中心点和缩放级别以显示所有标记
 * @param points 坐标点数组
 * @returns 中心点和缩放级别
 */
export function getBoundsForPoints(points: { lat: number; lng: number }[]): {
    center: [number, number]
    zoom: number
} {
    if (points.length === 0) {
        return { center: [116.6543, 40.1283], zoom: 12 }
    }

    if (points.length === 1) {
        return { center: [points[0].lng, points[0].lat], zoom: 15 }
    }

    const lats = points.map(p => p.lat)
    const lngs = points.map(p => p.lng)

    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)

    const centerLat = (minLat + maxLat) / 2
    const centerLng = (minLng + maxLng) / 2

    // 根据范围计算合适的缩放级别
    const latDiff = maxLat - minLat
    const lngDiff = maxLng - minLng
    const maxDiff = Math.max(latDiff, lngDiff)

    let zoom = 15
    if (maxDiff > 0.1) zoom = 10
    else if (maxDiff > 0.05) zoom = 11
    else if (maxDiff > 0.02) zoom = 12
    else if (maxDiff > 0.01) zoom = 13
    else if (maxDiff > 0.005) zoom = 14

    return { center: [centerLng, centerLat], zoom }
}