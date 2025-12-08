<template>
  <div class="container">
    <div class="display-block">
      <button class="my-botton" @click="count1++">Click Me</button>
      count:{{ count1 }}
      <br>
      <button class="my-botton" @click="count2++">Click Me</button>
      count:{{ count2 }}
      <br>
      count:{{ countA }}
    </div>
  </div>

</template>

<script setup>
import { computed, ref } from 'vue';

  let count1 = ref(0);
  let count2 = ref(0);
  let countA = computed(() => count1.value + count2.value);

function add() {
  count1.value++;
  console.log("Count1 is now:", count1.value);
}

</script>

<style scoped>
.container {
  display: flex;

  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #4d4c4c;

  .display-block {
    width: 200px;
    height: 150px;
    background-color: #64ffa7;
    border: 1px solid #d86a6a;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
    padding: 10px;

    .my-botton {
      width: 100px;
      height: 40px;
      background-color: #4caf50;
      color: white;
      border-radius: 4px;
      font-size: 16px;

      &:hover {
        background-color: #165419;
      }
    }
  }
}
</style>
