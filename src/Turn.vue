<template>
  <div class="container">
    <div class="display-black">
      <div class="navigate-bar">
        <!--两种动态样式-->
        <!--检测按钮按下-->
        <div class="navigate-selection" @click="tab = 'News'"
        :style="tab==='News'? {color:'blue'} : undefined">
        News
      </div>
        <div class="navigate-selection" @click="tab = 'Video'"
        :class="tab==='Video'? 'active' : undefined">
        Video
      </div>
    </div>
    <!--变换网页元素-->
    <div class="News" v-if="tab === 'News'">
      <div class="news-content" v-for="item in news" :key="item.id">
        <h3>{{ item.title }}</h3>
        <p>{{ item.description }}</p>
      </div>
    </div>
    <div class="Video" v-if="tab === 'Video'">
      <div class="video-content" v-for="item in videos" :key="item.id">
        <h3>{{ item.title }}</h3>
        <p>{{ item.description }}</p>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

//声明网页动态变量
let tab = ref('News');

const news = ref([
  { id: 1, title: 'News Item 1', description: 'Description for News Item 1' },
  { id: 2, title: 'News Item 2', description: 'Description for News Item 2' },
  { id: 3, title: 'News Item 3', description: 'Description for News Item 3' },
]);

const videos = ref([
  { id: 1, title: 'Video Item 1', description: 'Description for Video Item 1' },
  { id: 2, title: 'Video Item 2', description: 'Description for Video Item 2' },
  { id: 3, title: 'Video Item 3', description: 'Description for Video Item 3' }, 
  { id: 0, title: 'Video Item 0', description: 'Description for Video Item 0' },
]);

</script>

<style scoped>
.container{
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 10px;;

}
.display-black{
  width: 400px;
  height: auto;
  background-color: #64ffa7;
  border: 1px solid #d86a6a;
  padding: 20px;;
}

.navigate-bar{
  display: flex;
  margin-bottom: 10px;
  padding: 10px;
}

.navigate-selection{
  width: 80px;
  height: 30px;
  border: 1px solid gray;
  text-align: center;
  line-height: 30px;
  cursor: pointer;
}

.news-content,
.video-content{
  border-bottom: 1px solid #ddd;
  padding: 10px 0;
  
}

.active{
  color: blue;
}
</style>