<template>
    <div>Yay, it works: {{ message }}</div>
</template>

<script>
export default {
    data () {
        return {
            message: "my message"
        }
    },
    mounted () {
        console.log('vue is mounted');
        console.log(this.$el);
    }
};
</script>