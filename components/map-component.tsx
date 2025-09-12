"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, MapPin } from "lucide-react"

interface School {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  visited: boolean
  visitDates: string[]
}

interface MapComponentProps {
  schools: School[]
  onSchoolClick: (schoolId: string) => void
  onAddSchool?: (lat: number, lng: number) => void
}

declare global {
  interface Window {
    AMap: any
    initAMap: () => void
    recordVisit: (schoolId: string) => void
  }
}

export default function MapComponent({ schools, onSchoolClick, onAddSchool }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [isAddingMode, setIsAddingMode] = useState(false)
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)

  useEffect(() => {
    if (mapRef.current && window.AMap && mapInstanceRef.current) {
      const map = mapInstanceRef.current

      markersRef.current.forEach((marker) => {
        try {
          map.remove(marker)
        } catch (error) {
          console.log("[v0] 清除标记时出错:", error)
        }
      })
      markersRef.current = []

      schools.forEach((school) => {
        try {
          // 使用圆圈标记
          const circle = new window.AMap.Circle({
            center: [school.lng, school.lat],
            radius: 200, // 200米半径
            strokeColor: school.visited ? "#10b981" : "#ef4444", // 绿色：已访问，红色：未访问
            strokeWeight: 3,
            strokeOpacity: 0.8,
            fillColor: school.visited ? "#10b981" : "#ef4444", // 绿色：已访问，红色：未访问
            fillOpacity: 0.3,
          })

          map.add(circle)

          // 添加文字标签
          const text = new window.AMap.Text({
            text: school.visitDates.length > 0 ? school.visitDates.length.toString() : "",
            anchor: "center",
            draggable: false,
            cursor: "pointer",
            position: [school.lng, school.lat],
            style: {
              "background-color": "rgba(255,255,255,0.8)",
              "border": "1px solid #ccc",
              "border-radius": "3px",
              "color": "#333",
              "font-size": "12px",
              "font-weight": "bold",
              "padding": "2px 4px",
            },
          })

          map.add(text)

          const infoWindow = new window.AMap.InfoWindow({
            content: `
              <div style="padding: 12px; max-width: 250px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #1f2937;">${school.name}</h3>
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">${school.address}</p>
                <div style="font-size: 13px;">
                  <p style="margin: 0 0 4px 0; color: ${school.visited ? "#10b981" : "#ef4444"};">
                    状态: ${school.visited ? "已访问" : "未访问"}
                  </p>
                  <p style="margin: 0 0 4px 0; color: #374151;">
                    访问次数: ${school.visitDates.length}
                  </p>
                  ${
                    school.visitDates.length > 0
                      ? `
                    <p style="margin: 0; color: #374151;">
                      最近访问: ${school.visitDates[school.visitDates.length - 1]}
                    </p>
                  `
                      : ""
                  }
                </div>
                <div style="margin-top: 8px;">
                  <button onclick="window.recordVisit('${school.id}')" style="padding: 4px 8px; background: #10b981; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">
                    记录访问
                  </button>
                </div>
              </div>
            `,
            offset: new window.AMap.Pixel(0, -10),
          })

          circle.on("click", () => {
            if (!isAddingMode) {
              setSelectedSchool(school)
              infoWindow.open(map, [school.lng, school.lat])
            }
          })

          text.on("click", () => {
            if (!isAddingMode) {
              setSelectedSchool(school)
              infoWindow.open(map, [school.lng, school.lat])
            }
          })

          markersRef.current.push(circle, text)
        } catch (error) {
          console.log("[v0] 创建标记时出错:", error)
        }
      })

      // 添加全局函数供信息窗口调用
      window.recordVisit = (schoolId: string) => {
        onSchoolClick(schoolId)
        setSelectedSchool(null)
      }
    }
  }, [schools, onSchoolClick])

  useEffect(() => {
    if (mapRef.current && window.AMap && !mapInstanceRef.current) {
      try {
        // 确保容器有正确的尺寸
        const container = mapRef.current
        if (container.offsetWidth === 0 || container.offsetHeight === 0) {
          console.log("[v0] 地图容器尺寸为0，延迟初始化")
          setTimeout(() => {
            if (container.offsetWidth > 0 && container.offsetHeight > 0) {
              initializeMap()
            }
          }, 100)
          return
        }
        
        initializeMap()
      } catch (error) {
        console.error("[v0] 地图初始化失败:", error)
      }
    }

    function initializeMap() {
      if (!mapRef.current || mapInstanceRef.current) return
      
      const map = new window.AMap.Map(mapRef.current, {
        center: [116.6543, 40.1283], // 顺义区中心
        zoom: 11,
        mapStyle: "amap://styles/normal",
        viewMode: "2D",
        // 限制在顺义区范围内
        limitBounds: new window.AMap.Bounds([116.4, 40.0], [116.9, 40.4]),
        minZoom: 10,
        maxZoom: 16,
      })

      mapInstanceRef.current = map
      console.log("[v0] 顺义区地图初始化成功")
      
      // 强制重新调整地图大小
      setTimeout(() => {
        if (map) {
          map.getSize()
          map.setCenter([116.6543, 40.1283])
        }
      }, 200)
    }
  }, [])

  // 单独处理地图点击事件
  useEffect(() => {
    if (mapInstanceRef.current) {
      const map = mapInstanceRef.current
      
      // 移除之前的点击事件监听器
      map.off("click")
      
      // 添加新的点击事件监听器
      map.on("click", (e: any) => {
        if (isAddingMode && onAddSchool) {
          const { lng, lat } = e.lnglat
          onAddSchool(lat, lng)
          setIsAddingMode(false)
        }
      })
    }
  }, [isAddingMode, onAddSchool])

  // 确保地图正确渲染
  useEffect(() => {
    if (mapInstanceRef.current) {
      const timer = setTimeout(() => {
        try {
          mapInstanceRef.current.getSize()
          mapInstanceRef.current.setCenter([116.6543, 40.1283])
          console.log("[v0] 地图重新调整完成")
        } catch (error) {
          console.log("[v0] 地图调整出错:", error)
        }
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [schools])

  useEffect(() => {
    const initAMap = () => {
      console.log("[v0] 高德地图JavaScript API加载完成")
    }

    if (!window.AMap) {
      try {
        const script = document.createElement("script")
        script.src = "https://webapi.amap.com/maps?v=2.0&key=7c6fd1e571326c053ad9b19a53ea7127&callback=initAMap"
        script.async = true
        window.initAMap = initAMap

        script.onload = () => {
          console.log("[v0] 高德地图JavaScript API脚本加载成功")
        }

        script.onerror = (error) => {
          console.error("[v0] 高德地图JavaScript API脚本加载失败:", error)
        }

        document.head.appendChild(script)
      } catch (error) {
        console.error("[v0] 加载高德地图API时出错:", error)
      }
    }
  }, [])

  return (
    <div className="w-full">
      {/* 控制按钮 */}
      <div className="mb-3 flex flex-wrap gap-2">
        {onAddSchool && (
          <Button
            onClick={() => setIsAddingMode(!isAddingMode)}
            variant={isAddingMode ? "default" : "outline"}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            {isAddingMode ? "取消添加" : "添加学校"}
          </Button>
        )}
        
        <Button
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setCenter([116.6543, 40.1283])
              mapInstanceRef.current.setZoom(11)
            }
          }}
          variant="outline"
          size="sm"
        >
          <MapPin className="w-4 h-4 mr-2" />
          回到顺义区
        </Button>
        
        {isAddingMode && (
          <Badge variant="secondary" className="text-xs">
            点击地图添加学校位置
          </Badge>
        )}
      </div>

      {/* 地图容器 */}
      <div 
        ref={mapRef} 
        className={`w-full rounded-lg border ${isAddingMode ? 'cursor-crosshair' : ''}`} 
        style={{ 
          height: "500px", 
          minHeight: "500px",
          width: "100%",
          position: "relative"
        }} 
      />

      {/* 选中学校的详细信息 */}
      {selectedSchool && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900">{selectedSchool.name}</h4>
              <p className="text-sm text-blue-700 mt-1">{selectedSchool.address}</p>
              <div className="mt-2 flex gap-2">
                <Badge variant={selectedSchool.visited ? "default" : "secondary"}>
                  {selectedSchool.visited ? "已访问" : "未访问"}
                </Badge>
                {selectedSchool.visitDates.length > 0 && (
                  <Badge variant="outline">
                    访问 {selectedSchool.visitDates.length} 次
                  </Badge>
                )}
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => {
                onSchoolClick(selectedSchool.id)
                setSelectedSchool(null)
              }}
            >
              记录访问
            </Button>
          </div>
        </div>
      )}

      {/* 说明信息 */}
      <div className="mt-4 text-sm text-gray-600">
        <p>• 绿色圆圈：已访问学校</p>
        <p>• 红色圆圈：未访问学校</p>
        <p>• 圆圈中的数字：访问次数</p>
        <p>• 点击圆圈查看学校详情</p>
        {onAddSchool && <p>• 点击"添加学校"按钮后，在地图上点击位置添加新学校</p>}
      </div>
    </div>
  )
}
