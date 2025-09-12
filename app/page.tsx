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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    const loadAMapAPI = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.AMap) {
          console.log("[v0] 高德地图API已加载")
          setMapLoaded(true)
          resolve()
          return
        }

        const script = document.createElement("script")
        script.src = `https://webapi.amap.com/maps?v=2.0&key=7c6fd1e571326c053ad9b19a53ea7127`
        script.async = true
        script.defer = true

        script.onload = () => {
          console.log("[v0] 高德地图API加载成功")
          setMapLoaded(true)
          resolve()
        }

        script.onerror = (error) => {
          console.error("[v0] 高德地图API加载失败:", error)
          reject(error)
        }

        document.head.appendChild(script)
      })
    }

    loadAMapAPI().catch(console.error)
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

  const addNewSchool = () => {
    if (!newSchoolName || !newSchoolAddress || !pendingLocation) return

    const newSchool: School = {
      id: (schools.length + 1).toString(),
      name: newSchoolName,
      address: newSchoolAddress,
      lat: pendingLocation.lat,
      lng: pendingLocation.lng,
      visited: false,
      visitDates: [],
    }
    
    setSchools([...schools, newSchool])
    setNewSchoolName("")
    setNewSchoolAddress("")
    setPendingLocation(null)
    setIsAddDialogOpen(false)
  }

  const handleMapAddSchool = (lat: number, lng: number) => {
    setPendingLocation({ lat, lng })
    setIsAddDialogOpen(true)
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
                setPendingLocation(null)
                setNewSchoolName("")
                setNewSchoolAddress("")
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  添加学校
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>添加新学校</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {pendingLocation && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>选中位置：</strong> 纬度 {pendingLocation.lat.toFixed(6)}, 经度 {pendingLocation.lng.toFixed(6)}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="schoolName">学校名称</Label>
                    <Input
                      id="schoolName"
                      value={newSchoolName}
                      onChange={(e) => setNewSchoolName(e.target.value)}
                      placeholder="请输入学校名称"
                    />
                  </div>
                  <div>
                    <Label htmlFor="schoolAddress">学校地址</Label>
                    <Input
                      id="schoolAddress"
                      value={newSchoolAddress}
                      onChange={(e) => setNewSchoolAddress(e.target.value)}
                      placeholder="请输入学校地址"
                    />
                  </div>
                  <Button 
                    onClick={addNewSchool} 
                    className="w-full"
                    disabled={!newSchoolName || !newSchoolAddress || !pendingLocation}
                  >
                    添加学校
                  </Button>
                  {!pendingLocation && (
                    <p className="text-sm text-gray-500 text-center">
                      请先在地图上点击选择学校位置
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
                  onAddSchool={handleMapAddSchool}
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
