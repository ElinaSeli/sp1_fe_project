<template>
  <div class="flex h-screen w-full bg-white dark:bg-gray-950 overflow-hidden font-sans">
    <!-- Sidebar -->
    <AppSideNav />

    <!-- Content Area -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Top Timer Bar -->
      <AppTimerBar />

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto p-8 relative">
        <slot />
      </main>
    </div>
  </div>
</template>
