import { useState, useEffect } from 'react'
import Taro, { useLoad, useRouter, useReachBottom } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { AtSearchBar, AtTag, AtFloatLayout, AtRadio, AtLoadMore } from 'taro-ui'
import { machineryApi } from '../../services/api'
import type { Machinery } from '../../types'
import './index.scss'

export default function DeviceList() {
  const router = useRouter()
  const [list, setList] = useState<Machinery[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [category, setCategory] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [sortBy, setSortBy] = useState('default')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  useLoad(() => {
    const { keyword: kw, category: cat } = router.params
    if (kw) {
      setKeyword(decodeURIComponent(kw))
      setSearchKeyword(decodeURIComponent(kw))
    }
    if (cat) {
      setCategory(decodeURIComponent(cat))
    }
  })

  useEffect(() => {
    setList([])
    setPage(1)
    fetchList(1)
  }, [category])

  useReachBottom(() => {
    if (!loading && list.length < total) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchList(nextPage)
    }
  })

  async function fetchList(p: number) {
    setLoading(true)
    try {
      const result = await machineryApi.getList({
        page: p,
        pageSize: 10,
        category: category || undefined,
        keyword: searchKeyword || undefined,
        status: status || undefined
      })
      setTotal(result.total)
      setList((prev) => (p === 1 ? result.list : [...prev, ...result.list]))
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  function onSearch() {
    setList([])
    setPage(1)
    setSearchKeyword(keyword)
    fetchList(1)
  }

  function onFilterConfirm() {
    setShowFilter(false)
    setList([])
    setPage(1)
    fetchList(1)
  }

  function goToDetail(id: number) {
    Taro.navigateTo({ url: `/pages/device-detail/index?id=${id}` })
  }

  const sortOptions = [
    { label: '默认排序', value: 'default' },
    { label: '价格从低到高', value: 'price_asc' },
    { label: '价格从高到低', value: 'price_desc' }
  ]

  const statusOptions = [
    { label: '全部状态', value: '' },
    { label: '可购买', value: 'available' },
    { label: '已租赁', value: 'rented' },
    { label: '维护中', value: 'maintenance' }
  ]

  return (
    <View className='device-list-page'>
      <View className='search-wrap'>
        <AtSearchBar
          value={keyword}
          onChange={(v) => setKeyword(v)}
          onActionClick={onSearch}
          onConfirm={onSearch}
          placeholder='搜索设备'
          showActionButton
        />
        <View
          className='filter-btn'
          onClick={() => setShowFilter(true)}
        >
          <Text>筛选</Text>
        </View>
      </View>

      <View className='list-wrapper'>
        {list.map((item) => (
          <View
            key={item.id}
            className='device-card'
            onClick={() => goToDetail(item.id)}
          >
            <View className='device-image-placeholder'>
              <Text className='device-image-text'>{item.name.charAt(0)}</Text>
            </View>
            <View className='device-info'>
              <Text className='device-name'>{item.name}</Text>
              <View className='device-tags'>
                <AtTag size='small' type='primary'>型号：{item.model}</AtTag>
                <AtTag size='small' type='default'>{item.category}</AtTag>
              </View>
              <View className='device-specs'>
                <Text className='spec-item'>额定功率：{item.specs.power}</Text>
                <Text className='spec-item'>整机重量：{item.specs.weight}</Text>
              </View>
              <View className='device-footer'>
                <Text className='device-price'>¥{item.price}万</Text>
                <Text
                  className={`status-tag status-${item.status}`}
                >
                  {item.status === 'available' ? '可购买' : item.status === 'rented' ? '已租赁' : '维护中'}
                </Text>
              </View>
            </View>
          </View>
        ))}
        <AtLoadMore
          status={loading ? 'loading' : list.length >= total && list.length > 0 ? 'noMore' : 'more'}
        />
      </View>

      <AtFloatLayout
        isOpened={showFilter}
        title='筛选'
        onClose={() => setShowFilter(false)}
      >
        <View className='filter-content'>
          <View className='filter-section'>
            <Text className='filter-label'>排序方式</Text>
            <AtRadio
              options={sortOptions}
              value={sortBy}
              onClick={(v) => setSortBy(v)}
            />
          </View>
          <View className='filter-section'>
            <Text className='filter-label'>设备状态</Text>
            <AtRadio
              options={statusOptions}
              value={status}
              onClick={(v) => setStatus(v)}
            />
          </View>
          <View className='filter-actions'>
            <AtButton
              type='secondary'
              size='small'
              onClick={() => {
                setSortBy('default')
                setStatus('')
              }}
            >
              重置
            </AtButton>
            <AtButton
              type='primary'
              size='small'
              onClick={onFilterConfirm}
            >
              确定
            </AtButton>
          </View>
        </View>
      </AtFloatLayout>
    </View>
  )
}
