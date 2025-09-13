"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, Plus, CheckCircle, Clock, MapPin, RefreshCw } from "lucide-react"
import MapComponent from "@/components/map-component"

interface School {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  visited: boolean
  visitDates: string[]
  notes?: string
}

interface YearlyStats {
  year: number
  visited: number
  total: number
  totalVisits: number
}

export default function SchoolAttendanceSystem() {
  const [schools, setSchools] = useState<School[]>([])

  const [selectedYear, setSelectedYear] = useState<string>("total")
  const [newSchoolName, setNewSchoolName] = useState("")
  const [newSchoolAddress, setNewSchoolAddress] = useState("")
  const [newSchoolNotes, setNewSchoolNotes] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null)


  useEffect(() => {
    const loadBaiduMapAPI = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.BMap) {
          console.log("[v0] 百度地图API已加载")
          setMapLoaded(true)
          resolve()
          return
        }

        // 设置全局回调函数
        window.initBaiduMap = () => {
          console.log("[v0] 百度地图API加载成功")
          if (window.BMap) {
            console.log("[v0] BMap对象可用")
            setMapLoaded(true)
            resolve()
          } else {
            console.error("[v0] BMap对象不可用")
            reject(new Error("BMap对象不可用"))
          }
        }

        const script = document.createElement("script")
        // 百度地图API - 需要申请key
        script.src = `https://api.map.baidu.com/api?v=3.0&ak=lsJPs5TS0lXPAccFlnTDsa5oFeUrdngn&callback=initBaiduMap`
        script.async = true

        script.onerror = (error) => {
          console.error("[v0] 百度地图API加载失败:", error)
          reject(error)
        }

        document.head.appendChild(script)
      })
    }

    loadBaiduMapAPI().catch(console.error)
  }, [])



  const toggleSchoolVisited = (schoolId: string) => {
    setSchools(
      schools.map((school) => {
        if (school.id === schoolId) {
          const today = new Date().toISOString().split("T")[0]
          if (school.visited && school.visitDates.includes(today)) {
            const newVisitDates = school.visitDates.filter((date) => date !== today)
            return {
              ...school,
              visited: newVisitDates.length > 0,
              visitDates: newVisitDates,
            }
          } else {
            return {
              ...school,
              visited: true,
              visitDates: [...school.visitDates, today].sort(),
            }
          }
        }
        return school
      }),
    )
  }

  const calculateYearlyStats = (): YearlyStats[] => {
    const years = ["2025", "2026"]
    const stats = years.map((year) => {
      const schoolsVisitedInYear = schools.filter((school) => school.visitDates.some((date) => date.startsWith(year)))
      const totalVisitsInYear = schools.reduce((sum, school) => {
        return sum + school.visitDates.filter((date) => date.startsWith(year)).length
      }, 0)

      return {
        year: Number.parseInt(year),
        visited: schoolsVisitedInYear.length,
        total: schools.length,
        totalVisits: totalVisitsInYear,
      }
    })

    const totalStats = {
      year: 0,
      visited: schools.filter((s) => s.visited).length,
      total: schools.length,
      totalVisits: schools.reduce((sum, school) => sum + school.visitDates.length, 0),
    }

    return [totalStats, ...stats]
  }

  const yearlyStats = calculateYearlyStats()
  const currentYearStats =
    selectedYear === "total"
      ? yearlyStats.find((stat) => stat.year === 0)
      : yearlyStats.find((stat) => stat.year.toString() === selectedYear)

  const getFilteredSchools = () => {
    if (selectedYear === "total") {
      return schools
    }
    return schools.map((school) => ({
      ...school,
      visitDates: school.visitDates.filter((date) => date.startsWith(selectedYear)),
      visited: school.visitDates.some((date) => date.startsWith(selectedYear)),
    }))
  }

  const filteredSchools = getFilteredSchools()

  const searchSchools = async (query: string) => {
    if (!query.trim()) {
      console.log("[v0] 搜索条件不满足:", { query: query.trim() })
      return
    }
    
    console.log("[v0] 开始搜索顺义区学校:", query)
    setIsSearching(true)
    setSearchResults([])
    
    try {
      await searchWithBaiduWebAPI(query)
    } catch (error) {
      console.error("[v0] 搜索学校失败:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }



  const searchWithBaiduWebAPI = async (query: string) => {
    return new Promise<void>((resolve) => {
      const searchQuery = query.includes('学校') || query.includes('小学') || query.includes('中学') 
        ? query 
        : query + ' 学校'
      
      // 创建JSONP回调函数
      const callbackName = `baiduCallback_${Date.now()}`
      window[callbackName] = (data: any) => {
        console.log("[v0] 百度Web API响应:", data)
        
        if (data.status === 0 && data.results && data.results.length > 0) {
          const pois = data.results.map((poi: any, index: number) => ({
            id: `baidu_${poi.uid || index}`,
            name: poi.name,
            address: poi.address,
            location: {
              lat: poi.location.lat,
              lng: poi.location.lng
            },
            type: poi.detail_info?.tag || "学校"
          }))
          
          console.log("[v0] 百度Web API找到:", pois.length, "个结果")
          setSearchResults(pois)
        } else {
          console.log("[v0] 百度Web API搜索无结果")
          setSearchResults([])
        }
        
        // 清理
        delete window[callbackName]
        document.head.removeChild(script)
        resolve()
      }
      
      // 创建JSONP请求
      const script = document.createElement('script')
      const apiUrl = `https://api.map.baidu.com/place/v2/search?query=${encodeURIComponent(searchQuery)}&region=顺义区&output=json&ak=lsJPs5TS0lXPAccFlnTDsa5oFeUrdngn&callback=${callbackName}`
      
      script.src = apiUrl
      script.onerror = () => {
        console.error("[v0] 百度Web API请求失败")
        setSearchResults([])
        delete window[callbackName]
        document.head.removeChild(script)
        resolve()
      }
      
      document.head.appendChild(script)
      
      // 超时处理
      setTimeout(() => {
        if (window[callbackName]) {
          console.log("[v0] 百度Web API请求超时")
          setSearchResults([])
          delete window[callbackName]
          if (document.head.contains(script)) {
            document.head.removeChild(script)
          }
          resolve()
        }
      }, 5000)
    })
  }



  const testMapAPI = () => {
    console.log("[v0] 开始测试百度地图Web服务API")
    
    // 直接测试Web服务API
    const testQuery = "天安门"
    const callbackName = `testCallback_${Date.now()}`
    
    window[callbackName] = (data: any) => {
      console.log("[v0] 百度Web API测试响应:", data)
      
      if (data.status === 0 && data.results && data.results.length > 0) {
        console.log("[v0] 百度Web API测试成功！找到", data.results.length, "个结果")
        alert(`百度Web API测试成功！找到 ${data.results.length} 个结果`)
      } else {
        console.log("[v0] 百度Web API测试失败:", data.message || "未知错误")
        alert(`百度Web API测试失败: ${data.message || "未知错误"}`)
      }
      
      // 清理
      delete window[callbackName]
      document.head.removeChild(script)
    }
    
    const script = document.createElement('script')
    const apiUrl = `https://api.map.baidu.com/place/v2/search?query=${encodeURIComponent(testQuery)}&region=北京市&output=json&ak=lsJPs5TS0lXPAccFlnTDsa5oFeUrdngn&callback=${callbackName}`
    
    script.src = apiUrl
    script.onerror = () => {
      console.error("[v0] 百度Web API请求失败")
      alert("百度Web API请求失败，请检查网络连接和API Key")
      delete window[callbackName]
      document.head.removeChild(script)
    }
    
    document.head.appendChild(script)
  }

  const selectLocation = (poi: any) => {
    console.log("[v0] 选择位置:", poi)
    setSelectedLocation({
      lat: poi.location.lat,
      lng: poi.location.lng,
      address: poi.address,
    })
    setNewSchoolAddress(poi.address)
    setNewSchoolName(poi.name) // 自动填充学校名称
    setSearchResults([])
  }

  const addNewSchool = () => {
    if (!newSchoolName || !newSchoolAddress || !selectedLocation) return

    const newSchool: School = {
      id: (schools.length + 1).toString(),
      name: newSchoolName,
      address: newSchoolAddress,
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      visited: false,
      visitDates: [],
      notes: newSchoolNotes || undefined,
    }
    
    setSchools([...schools, newSchool])
    setNewSchoolName("")
    setNewSchoolAddress("")
    setNewSchoolNotes("")
    setSelectedLocation(null)
    setSearchResults([])
    setIsAddDialogOpen(false)
  }

  useEffect(() => {
    localStorage.setItem("schoolAttendanceData", JSON.stringify(schools))
  }, [schools])

  useEffect(() => {
    const saved = localStorage.getItem("schoolAttendanceData")
    if (saved) {
      setSchools(JSON.parse(saved))
    }
  }, [])

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">学校听课管理系统</h1>
            <p className="text-muted-foreground mt-2">跟踪和管理您的学校访问记录</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open)
              if (!open) {
                setSelectedLocation(null)
                setNewSchoolName("")
                setNewSchoolAddress("")
                setNewSchoolNotes("")
                setSearchResults([])
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  添加学校
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>添加新学校</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="schoolName">学校名称</Label>
                    <Input
                      id="schoolName"
                      value={newSchoolName}
                      onChange={(e) => {
                        setNewSchoolName(e.target.value)
                        if (e.target.value.trim()) {
                          searchSchools(e.target.value)
                        } else {
                          setSearchResults([])
                        }
                      }}
                      placeholder="如：顺义一中、实验小学、双兴小学等"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      建议搜索：顺义一中、顺义二中、实验小学、双兴小学、光明小学等
                    </div>
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={testMapAPI}
                    >
                      测试地图API
                    </Button>
                    {isSearching && (
                      <p className="text-sm text-gray-500 mt-1">搜索中...</p>
                    )}
                    {!isSearching && newSchoolName.trim() && searchResults.length === 0 && (
                      <p className="text-sm text-red-500 mt-1">未找到相关学校，请尝试其他关键词</p>
                    )}
                    {searchResults.length > 0 && (
                      <div className="mt-2 max-h-40 overflow-y-auto border rounded-md bg-white shadow-sm">
                        <div className="p-2 bg-gray-50 text-xs text-gray-600 border-b">
                          找到 {searchResults.length} 个结果
                        </div>
                        {searchResults.map((poi) => (
                          <div
                            key={poi.id}
                            className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition-colors"
                            onClick={() => selectLocation(poi)}
                          >
                            <div className="font-medium text-sm text-gray-900">{poi.name}</div>
                            <div className="text-xs text-gray-600 mt-1">{poi.address}</div>
                            {poi.type && (
                              <div className="text-xs text-blue-600 mt-1">类型: {poi.type}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {selectedLocation && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>已选择位置：</strong> {selectedLocation.address}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="schoolAddress">学校地址</Label>
                    <Input
                      id="schoolAddress"
                      value={newSchoolAddress}
                      onChange={(e) => setNewSchoolAddress(e.target.value)}
                      placeholder="地址会自动填充"
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="schoolNotes">备注信息（可选）</Label>
                    <Input
                      id="schoolNotes"
                      value={newSchoolNotes}
                      onChange={(e) => setNewSchoolNotes(e.target.value)}
                      placeholder="请输入备注信息"
                    />
                  </div>
                  
                  <Button 
                    onClick={addNewSchool} 
                    className="w-full"
                    disabled={!newSchoolName || !newSchoolAddress || !selectedLocation}
                  >
                    添加学校
                  </Button>
                  
                  {!selectedLocation && newSchoolName && (
                    <p className="text-sm text-gray-500 text-center">
                      请从搜索结果中选择学校位置
                    </p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium">总学校数</CardTitle>
              <MapPin className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-xl font-bold">{schools.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium">已访问学校</CardTitle>
              <CheckCircle className="h-3 w-3 text-accent" />
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-xl font-bold text-accent">{currentYearStats?.visited || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium">总访问次数</CardTitle>
              <Clock className="h-3 w-3 text-blue-500" />
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-xl font-bold text-blue-500">{currentYearStats?.totalVisits || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="flex items-center gap-1 text-xs font-medium">
                平均访问次数
                <Calendar className="h-3 w-3 text-orange-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-xl font-bold text-orange-500">
                {currentYearStats?.visited ? (currentYearStats.totalVisits / currentYearStats.visited).toFixed(1) : "0"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="flex items-center gap-1 text-xs font-medium">
                完成率
                <CheckCircle className="h-3 w-3 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-xl font-bold">
                {currentYearStats?.total ? Math.round((currentYearStats.visited / currentYearStats.total) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                学校分布地图
                <Badge variant="outline" className="ml-2">
                  {selectedYear === "total" ? "总计" : `${selectedYear}年`}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mapLoaded ? (
                <MapComponent 
                  schools={filteredSchools} 
                  onSchoolClick={toggleSchoolVisited}
                />
              ) : (
                <div className="bg-muted rounded-lg h-96 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">正在加载高德地图...</p>
                    <p className="text-xs mt-1">请稍候</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>统计数据</CardTitle>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="选择年份" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total">总计</SelectItem>
                  <SelectItem value="2025">2025年</SelectItem>
                  <SelectItem value="2026">2026年</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="space-y-4">
              {yearlyStats.map((stat) => (
                <div key={stat.year} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{stat.year === 0 ? "总计" : `${stat.year}年`}</span>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {stat.visited}/{stat.total} 学校
                      </div>
                      <div className="text-xs text-blue-500">{stat.totalVisits} 次访问</div>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-accent h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stat.total > 0 ? (stat.visited / stat.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              学校列表
              <Badge variant="outline">{selectedYear === "total" ? "显示所有记录" : `${selectedYear}年记录`}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSchools.map((school) => (
                <div
                  key={school.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    school.visited
                      ? "border-accent bg-accent/5 hover:bg-accent/10"
                      : "border-border bg-card hover:bg-muted/50"
                  }`}
                  onClick={() => toggleSchoolVisited(school.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`font-semibold ${school.visited ? "text-accent" : "text-foreground"}`}>
                        {school.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{school.address}</p>
                      {school.notes && (
                        <p className="text-xs text-blue-600 mt-1 bg-blue-50 px-2 py-1 rounded">
                          备注: {school.notes}
                        </p>
                      )}

                      {school.visitDates.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">访问 {school.visitDates.length} 次</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {school.visitDates.slice(-4).map((date) => (
                              <Badge key={date} variant="secondary" className="text-xs">
                                {date}
                              </Badge>
                            ))}
                            {school.visitDates.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{school.visitDates.length - 4}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="ml-2 flex flex-col items-center">
                      {school.visited ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-accent" />
                          {school.visitDates.length > 1 && (
                            <span className="text-xs text-accent font-bold mt-1">{school.visitDates.length}</span>
                          )}
                        </>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
