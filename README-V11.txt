export default defineNuxtRouteMiddleware(()=>{if(import.meta.client && sessionStorage.getItem('tandtid:parent')!=='1') return navigateTo('/parent/login')})
