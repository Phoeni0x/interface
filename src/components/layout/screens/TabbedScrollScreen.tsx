import React, { ReactElement, Ref, useRef, useState } from 'react'
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Route, SceneRendererProps, TabBar, TabView } from 'react-native-tab-view'
import { ScrollEvent } from 'recyclerlistview/dist/reactnative/core/scrollcomponent/BaseScrollView'
import { useAppTheme } from 'src/app/hooks'
import { AnimatedFlex } from 'src/components/layout/Flex'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { dimensions } from 'src/styles/sizing'
import { theme as FixedTheme } from 'src/styles/theme'

type TabbedScrollScreenProps = {
  renderTab: (
    route: Route,
    scrollProps: TabViewScrollProps,
    loadingContainerStyle: ViewStyle
  ) => ReactElement | null
  tabs: { key: string; title: string }[]
  headerContent?: ReactElement
}

export type TabViewScrollProps = {
  ref: Ref<any>
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent> | ScrollEvent) => void
  contentContainerStyle: ViewStyle
}

export const TAB_VIEW_SCROLL_THROTTLE = 16
const TAB_BAR_HEIGHT = 48
const INITIAL_TAB_BAR_HEIGHT = 100

export const TabStyles = StyleSheet.create({
  header: {
    marginBottom: 0,
    paddingBottom: 0,
    position: 'absolute',
    width: '100%',
  },
  indicator: { backgroundColor: FixedTheme.colors.userThemeMagenta, height: 2 },
  tab: { margin: 0, padding: 0, top: 0 },
  tabBar: {
    paddingHorizontal: FixedTheme.spacing.lg,
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 1,
  },
  // eslint-disable-next-line react-native/no-unused-styles
  tabView: {
    marginHorizontal: FixedTheme.spacing.md,
  },
})

export const renderTabLabel = ({ route, focused }: { route: Route; focused: boolean }) => {
  return (
    <Text color={focused ? 'textPrimary' : 'textTertiary'} variant="mediumLabel">
      {route.title}
    </Text>
  )
}

export default function TabbedScrollScreen({
  renderTab,
  tabs,
  headerContent,
}: TabbedScrollScreenProps) {
  const insets = useSafeAreaInsets()
  const theme = useAppTheme()

  const [headerHeight, setHeaderHeight] = useState(INITIAL_TAB_BAR_HEIGHT) // estimation for initial height, updated on layout
  const animatedScrollY = useSharedValue(0)
  const isListGliding = useRef(false)

  const routes = tabs
  const [tabIndex, setIndex] = useState(0)
  const tabRefs = useRef<{ key: string; value: any; lastScrollOffset?: number }[]>([])

  const tabBarAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            animatedScrollY.value,
            [0, headerHeight],
            [headerHeight, 0],
            Extrapolate.CLAMP
          ),
        },
      ],
    }
  })

  const renderTabBar = (sceneProps: SceneRendererProps) => {
    return (
      <Animated.View
        style={[
          TabStyles.tabBar,
          tabBarAnimatedStyle,
          { backgroundColor: theme.colors.backgroundBackdrop },
        ]}>
        <TabBar
          {...sceneProps}
          indicatorStyle={[TabStyles.indicator]}
          navigationState={{ index: tabIndex, routes }}
          renderLabel={renderTabLabel}
          style={[TabStyles.tab, { backgroundColor: theme.colors.backgroundBackdrop }]}
          onTabPress={({ preventDefault, route }) => {
            if (isListGliding.current) {
              preventDefault()
            }
            animatedScrollY.value = 0

            const found = tabRefs.current.find((e) => e.key === route.key)
            if (found) {
              // TODO (Thomas): Figure out smooth scrolling for RecyclerListView
              found.value.scrollToOffset(0)
            }
          }}
        />
      </Animated.View>
    )
  }

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            animatedScrollY.value,
            [0, headerHeight + insets.top],
            [0, -headerHeight - insets.top],
            Extrapolate.CLAMP
          ),
        },
      ],
    }
  })
  const scrollPropsForTab = (routeKey: string) => {
    return {
      ref: (ref: Ref<any>) => {
        if (ref && routeKey) {
          const found = tabRefs.current.find((e) => e.key === routeKey)
          if (!found) {
            tabRefs.current.push({ key: routeKey, value: ref })
          }
        }
      },
      onScroll: (event: { nativeEvent: { contentOffset: { y: number } } }) => {
        animatedScrollY.value = event.nativeEvent.contentOffset.y
      },
      contentContainerStyle: {
        paddingTop: headerHeight + TAB_BAR_HEIGHT,
        minHeight: dimensions.fullHeight - TAB_BAR_HEIGHT - headerHeight,
      },
    }
  }

  const loadingContainerStyle = {
    paddingTop: headerHeight + TAB_BAR_HEIGHT,
  }

  const onTabIndexChange = (index: number) => {
    // Update with last scroll position
    const previousTab = routes[tabIndex]
    const previousTabRef = tabRefs.current.find((e) => e.key === previousTab.key)
    if (previousTabRef) {
      previousTabRef.lastScrollOffset = animatedScrollY.value
    }

    setIndex(index)

    const newTab = routes[index]
    const newTabRef = tabRefs.current.find((e) => e.key === newTab.key)

    // If we switch tabs and the next tab hasn't scrolled, we want to avoid showing a blank padding space by scrolling to top on new tab.
    if (newTabRef && !newTabRef?.lastScrollOffset) {
      newTabRef?.value.scrollToOffset(0)
      animatedScrollY.value = 0
    }

    // TODO (Thomas): Handle case where both tabs have scrolled but new tab has scrolled less than the other
  }
  return (
    <Screen edges={['top', 'left', 'right']}>
      <TabView
        initialLayout={{
          height: 0,
          width: dimensions.fullWidth,
        }}
        lazy={true}
        navigationState={{ index: tabIndex, routes }}
        renderScene={(props) =>
          renderTab(props.route, scrollPropsForTab(props.route.key), loadingContainerStyle)
        }
        renderTabBar={renderTabBar}
        onIndexChange={onTabIndexChange}
      />
      <AnimatedFlex
        style={[TabStyles.header, headerAnimatedStyle, { marginTop: insets.top }]}
        onLayout={(event: LayoutChangeEvent) => setHeaderHeight(event.nativeEvent.layout.height)}>
        {headerContent}
      </AnimatedFlex>
    </Screen>
  )
}
